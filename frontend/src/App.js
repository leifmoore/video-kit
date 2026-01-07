'use client';

import React, { useEffect, useRef, useState } from 'react';
import ImageGallery from './components/ImageGallery';
import InputPanel from './components/InputPanel';
import OutputPanel from './components/OutputPanel';
import ApiKeyModal from './components/ApiKeyModal';
import {
  createKieTask,
  getKieTaskStatus,
  uploadImageToKie,
} from './services/api';
import {
  clearAllData,
  deleteImage,
  deleteJob,
  getImages,
  getJobs,
  saveImage,
  saveJob,
} from './services/storage';

const POLL_INTERVAL_MS = 30000;
const MAX_POLL_ATTEMPTS = 20;

const estimateCost = (model, duration) => {
  if (model === 'sora2') {
    return (duration / 10) * 0.15;
  }
  return duration * 0.05;
};

const makeId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

function App() {
  const [jobs, setJobs] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [theme, setTheme] = useState('light');
  const [viewMode, setViewMode] = useState('list');
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [customImages, setCustomImages] = useState([]);

  const jobsRef = useRef([]);
  const pollingRef = useRef({});
  const imageUrlsRef = useRef({});

  useEffect(() => {
    jobsRef.current = jobs;
  }, [jobs]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    loadImages();
    loadJobs();

    return () => {
      clearPreviewUrls();
    };
  }, []);

  const clearPreviewUrls = () => {
    Object.values(imageUrlsRef.current).forEach((url) => URL.revokeObjectURL(url));
    imageUrlsRef.current = {};
  };

  const attachPreviewUrl = (image) => {
    if (!image?.blob) {
      return { ...image, previewUrl: '' };
    }
    const url = URL.createObjectURL(image.blob);
    imageUrlsRef.current[image.id] = url;
    return { ...image, previewUrl: url };
  };

  const revokePreviewUrl = (imageId) => {
    const url = imageUrlsRef.current[imageId];
    if (url) {
      URL.revokeObjectURL(url);
      delete imageUrlsRef.current[imageId];
    }
  };

  const loadImages = async () => {
    try {
      clearPreviewUrls();
      const storedImages = await getImages();
      const sorted = storedImages.sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      const hydrated = sorted.map((image) => attachPreviewUrl(image));
      setCustomImages(hydrated);

      if (hydrated.length === 0) {
        setSelectedImage(null);
        return;
      }

      const stillSelected = selectedImage
        ? hydrated.find((image) => image.id === selectedImage.id)
        : null;
      setSelectedImage(stillSelected || hydrated[0]);
    } catch (error) {
      console.error('Failed to load images:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const storedJobs = await getJobs();
      const sorted = storedJobs.sort(
        (a, b) =>
          new Date(b.updatedAt || b.createdAt).getTime() -
          new Date(a.updatedAt || a.createdAt).getTime()
      );
      setJobs(sorted);

      sorted.forEach((job) => {
        if (
          ['pending', 'uploading', 'generating'].includes(job.status) &&
          job.kieTaskId
        ) {
          startPolling(job.id, job.kieTaskId, job.model);
        }
      });
    } catch (error) {
      console.error('Failed to load jobs:', error);
    }
  };

  const updateJob = async (jobId, updates, fallbackJob) => {
    const now = new Date().toISOString();
    const baseJob =
      jobsRef.current.find((job) => job.id === jobId) || fallbackJob;

    if (!baseJob) {
      return null;
    }

    const updatedJob = {
      ...baseJob,
      ...updates,
      updatedAt: now,
    };

    setJobs((prevJobs) =>
      prevJobs.map((job) => (job.id === jobId ? updatedJob : job))
    );
    await saveJob(updatedJob);
    return updatedJob;
  };

  const startPolling = (jobId, taskId, model) => {
    if (pollingRef.current[jobId]) {
      return;
    }
    pollingRef.current[jobId] = true;

    const poll = async (attempt) => {
      if (!jobsRef.current.find((job) => job.id === jobId)) {
        pollingRef.current[jobId] = false;
        return;
      }

      try {
        const status = await getKieTaskStatus(taskId, model);
        if (status.state === 'success') {
          if (!status.videoUrl) {
            await updateJob(jobId, {
              status: 'failed',
              error: 'No video URL returned from Kie.ai',
            });
            pollingRef.current[jobId] = false;
            return;
          }

          await updateJob(jobId, {
            status: 'completed',
            videoUrl: status.videoUrl,
            thumbnailUrl: status.thumbnailUrl || null,
            completedAt: new Date().toISOString(),
          });
          pollingRef.current[jobId] = false;
          return;
        }

        if (status.state === 'fail') {
          await updateJob(jobId, {
            status: 'failed',
            error: status.failMsg || 'Video generation failed on Kie.ai',
          });
          pollingRef.current[jobId] = false;
          return;
        }

        if (attempt >= MAX_POLL_ATTEMPTS) {
          await updateJob(jobId, {
            status: 'failed',
            error: 'Generation timeout (exceeded 10 minutes)',
          });
          pollingRef.current[jobId] = false;
          return;
        }

        setTimeout(() => poll(attempt + 1), POLL_INTERVAL_MS);
      } catch (error) {
        await updateJob(jobId, {
          status: 'failed',
          error: error.message || 'Polling error',
        });
        pollingRef.current[jobId] = false;
      }
    };

    poll(0);
  };

  const handleUploadImage = async (file) => {
    const id = makeId();
    const now = new Date().toISOString();
    const imageRecord = {
      id,
      filename: file.name || 'image',
      type: file.type || 'image/png',
      createdAt: now,
      blob: file,
    };

    await saveImage(imageRecord);
    const hydrated = attachPreviewUrl(imageRecord);
    setCustomImages((prev) => [hydrated, ...prev]);
    setSelectedImage(hydrated);
    return hydrated;
  };

  const handleDeleteImage = async (imageId) => {
    await deleteImage(imageId);
    revokePreviewUrl(imageId);
    setCustomImages((prev) => prev.filter((image) => image.id !== imageId));

    if (selectedImage?.id === imageId) {
      const remaining = customImages.filter((image) => image.id !== imageId);
      setSelectedImage(remaining[0] || null);
    }
  };

  const handleClearLocalData = async () => {
    const confirmClear = window.confirm(
      'Clear all local images and job history? This cannot be undone.'
    );
    if (!confirmClear) {
      return;
    }

    await clearAllData();
    clearPreviewUrls();
    setCustomImages([]);
    setJobs([]);
    setSelectedImage(null);
    pollingRef.current = {};
  };

  const handleAddImageFromBlob = async (blob, filename = 'frame.png') => {
    const file = new File([blob], filename, { type: blob.type || 'image/png' });
    return handleUploadImage(file);
  };

  const handleGenerate = async (formData) => {
    if (!selectedImage?.blob) {
      alert('Please select or upload an image');
      return;
    }

    setIsGenerating(true);
    const jobId = makeId();
    const now = new Date().toISOString();
    const duration = formData.duration || 10;

    const job = {
      id: jobId,
      model: formData.model || 'sora2',
      fighter1: null,
      fighter2: null,
      prompt: formData.prompt,
      imageSource: 'custom',
      status: 'uploading',
      options: {
        music: formData.music,
        crowd: formData.crowd,
        commentators: formData.commentators,
        likeAnime: formData.likeAnime,
      },
      videoParams: {
        duration,
        quality: '720p',
        aspectRatio: formData.aspectRatio || '16:9',
      },
      cost: estimateCost(formData.model || 'sora2', duration),
      createdAt: now,
      updatedAt: now,
      customImageId: selectedImage.id,
    };

    setJobs((prev) => [job, ...prev]);
    await saveJob(job);

    try {
      const file =
        selectedImage.blob instanceof File
          ? selectedImage.blob
          : new File([selectedImage.blob], selectedImage.filename || 'image.png', {
              type: selectedImage.type || selectedImage.blob.type || 'image/png',
            });

      const uploadResult = await uploadImageToKie(file);
      const imageUrl = uploadResult.url;

      const taskResult = await createKieTask({
        prompt: formData.prompt,
        imageUrl,
        duration,
        quality: '720p',
        aspectRatio: formData.aspectRatio || '16:9',
        model: formData.model || 'sora2',
      });

      await updateJob(
        jobId,
        {
          status: 'generating',
          kieTaskId: taskResult.taskId,
        },
        job
      );

      startPolling(jobId, taskResult.taskId, formData.model || 'sora2');
    } catch (error) {
      await updateJob(
        jobId,
        {
          status: 'failed',
          error: error.message || 'Generation failed',
        },
        job
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDeleteJob = async (jobId) => {
    await deleteJob(jobId);
    setJobs((prev) => prev.filter((job) => job.id !== jobId));
  };

  const handleCheckStatus = async (jobId) => {
    const job = jobsRef.current.find((item) => item.id === jobId);
    if (!job?.kieTaskId) {
      return { status: 'failed', message: 'Job has no task ID to check' };
    }

    try {
      const status = await getKieTaskStatus(job.kieTaskId, job.model);
      if (status.state === 'success') {
        if (!status.videoUrl) {
          await updateJob(jobId, {
            status: 'failed',
            error: 'No video URL returned from Kie.ai',
          });
          return { status: 'failed', message: 'No video URL returned' };
        }

        await updateJob(jobId, {
          status: 'completed',
          videoUrl: status.videoUrl,
          thumbnailUrl: status.thumbnailUrl || null,
          completedAt: new Date().toISOString(),
        });
        return { status: 'completed', message: 'Job completed' };
      }

      if (status.state === 'fail') {
        await updateJob(jobId, {
          status: 'failed',
          error: status.failMsg || 'Generation failed',
        });
        return { status: 'failed', message: status.failMsg || 'Generation failed' };
      }

      return {
        status: 'generating',
        message: `Job is still processing (state: ${status.state})`,
      };
    } catch (error) {
      return { status: 'failed', message: error.message || 'Status check failed' };
    }
  };


  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const toggleViewMode = () => {
    setViewMode((prev) => (prev === 'list' ? 'embed' : 'list'));
  };

  const handleImageSelect = (image) => {
    setSelectedImage(image);
  };

  return (
    <div className="app">
      <div className="main-container">
        <ImageGallery
          images={customImages}
          selectedImage={selectedImage}
          onImageSelect={handleImageSelect}
          onUploadImage={handleUploadImage}
          onDeleteImage={handleDeleteImage}
          onClearLocalData={handleClearLocalData}
          theme={theme}
          onToggleTheme={toggleTheme}
          onOpenApiKey={() => setShowApiKeyModal(true)}
        />

        <InputPanel
          jobs={jobs}
          selectedImage={selectedImage}
          onGenerate={handleGenerate}
          isGenerating={isGenerating}
        />

        <OutputPanel
          jobs={jobs}
          viewMode={viewMode}
          onToggleView={toggleViewMode}
          onDeleteJob={handleDeleteJob}
          onCheckStatus={handleCheckStatus}
          onAddImage={handleAddImageFromBlob}
        />
      </div>

      {showApiKeyModal && (
        <ApiKeyModal onClose={() => setShowApiKeyModal(false)} />
      )}
    </div>
  );
}

export default App;
