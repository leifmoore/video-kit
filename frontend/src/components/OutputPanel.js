'use client';

import React, { useEffect, useRef, useState } from 'react';
import ConfirmationModal from './ConfirmationModal';
import VideoRowMenu from './VideoRowMenu';
import { getDownloadUrl } from '../services/api';
import DownloadIcon from '../assets/icons/ic_download.svg';
import CopyIcon from '../assets/icons/ic_copy.svg';
import ScreenshotIcon from '../assets/icons/ic_screenshot.svg';
import AddImageIcon from '../assets/icons/ic_addtogallery.svg';
import ListIcon from '../assets/icons/ic_list.svg';
import EmbedIcon from '../assets/icons/ic_embed.svg';
import PrevUpIcon from '../assets/icons/ic_prev_up.svg';
import NextDownIcon from '../assets/icons/ic_next_down.svg';
import MoreIcon from '../assets/icons/ic_more_vert.svg';

function OutputPanel({
  jobs,
  viewMode,
  onToggleView,
  onDeleteJob,
  onCheckStatus,
  onAddImage,
}) {
  const [selectedJob, setSelectedJob] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentEmbedIndex, setCurrentEmbedIndex] = useState(0);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [jobToDelete, setJobToDelete] = useState(null);
  const [openMenuJobId, setOpenMenuJobId] = useState(null);
  const menuButtonRefs = useRef({});
  const videoRef = useRef(null);

  const captureFrame = () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `screenshot-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing frame:', error);
      alert('Unable to capture frame. This may be a cross-origin issue.');
    }
  };

  const captureFrameToGallery = async () => {
    const video = videoRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      canvas.toBlob(async (blob) => {
        if (!blob) return;
        try {
          await onAddImage(blob, `frame-${Date.now()}.png`);
        } catch (error) {
          console.error('Error saving frame:', error);
          alert('Failed to add frame to gallery: ' + error.message);
        }
      }, 'image/png');
    } catch (error) {
      console.error('Error capturing frame:', error);
      alert('Unable to capture frame. This may be a cross-origin issue.');
    }
  };

  useEffect(() => {
    if (!selectedJob && jobs.length > 0) {
      const firstCompleted = jobs.find((job) => job.status === 'completed');
      if (firstCompleted) {
        setSelectedJob(firstCompleted);
      }
    }
  }, [jobs, selectedJob]);

  const filteredJobs = jobs.filter((job) => {
    if (statusFilter === 'completed' && job.status !== 'completed') return false;
    if (statusFilter === 'failed' && job.status !== 'failed') return false;
    return true;
  });

  const completedJobs = jobs.filter((job) => job.status === 'completed');

  const handleVideoClick = (job) => {
    setSelectedJob(job);
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      pending: { label: 'Pending', className: 'status-pending' },
      uploading: { label: 'Uploading', className: 'status-uploading' },
      generating: { label: 'Generating', className: 'status-generating' },
      downloading: { label: 'Downloading', className: 'status-downloading' },
      completed: { label: 'Completed', className: 'status-completed' },
      failed: { label: 'Failed', className: 'status-failed' },
    };

    const statusInfo = statusMap[status] || statusMap.pending;

    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.label}
      </span>
    );
  };

  const downloadVideo = (job) => {
    if (!job.videoUrl) {
      return;
    }
    const link = document.createElement('a');
    link.href = getDownloadUrl(job.videoUrl);
    link.download = `video-${job.id}.mp4`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = (prompt) => {
    navigator.clipboard.writeText(prompt);
    alert('Prompt copied to clipboard!');
  };

  const handleNextEmbed = () => {
    if (currentEmbedIndex < completedJobs.length - 1) {
      const nextIndex = currentEmbedIndex + 1;
      setCurrentEmbedIndex(nextIndex);
      setSelectedJob(completedJobs[nextIndex]);
    }
  };

  const handlePrevEmbed = () => {
    if (currentEmbedIndex > 0) {
      const prevIndex = currentEmbedIndex - 1;
      setCurrentEmbedIndex(prevIndex);
      setSelectedJob(completedJobs[prevIndex]);
    }
  };

  const handleMoreClick = (e, job) => {
    e.stopPropagation();
    setOpenMenuJobId(job.id);
  };

  const handleCloseMenu = () => {
    setOpenMenuJobId(null);
  };

  const handleDownloadClick = (job) => {
    downloadVideo(job);
    setOpenMenuJobId(null);
  };

  const handleCopyPromptClick = (job) => {
    copyPrompt(job.prompt);
    setOpenMenuJobId(null);
  };

  const handleDeleteClick = (job) => {
    setJobToDelete(job);
    setShowDeleteConfirmation(true);
    setOpenMenuJobId(null);
  };

  const handleCheckStatusClick = async (job) => {
    setOpenMenuJobId(null);
    try {
      const result = await onCheckStatus(job.id);
      if (result.status === 'completed') {
        alert('Job completed');
      } else if (result.status === 'failed') {
        alert('Job failed: ' + result.message);
      } else {
        alert(result.message || 'Job is still processing');
      }
    } catch (error) {
      console.error('Failed to check job status:', error);
      alert('Failed to check status: ' + error.message);
    }
  };

  const handleConfirmDelete = async () => {
    if (jobToDelete) {
      try {
        await onDeleteJob(jobToDelete.id);

        if (selectedJob?.id === jobToDelete.id) {
          setSelectedJob(null);
        }

        setShowDeleteConfirmation(false);
        setJobToDelete(null);
      } catch (error) {
        console.error('Failed to delete job:', error);
        alert('Failed to delete video: ' + error.message);
      }
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirmation(false);
    setJobToDelete(null);
  };

  return (
    <div className="output-panel-new">
      <button
        className="view-toggle-btn"
        onClick={onToggleView}
        title={viewMode === 'list' ? 'Big embed view' : 'List view'}
      >
        {viewMode === 'list' ? <EmbedIcon /> : <ListIcon />}
      </button>

      <div className={`output-content ${viewMode === 'list' ? 'list-mode' : ''}`}>
        {viewMode === 'embed' ? (
          <div className="embed-view">
            {selectedJob && selectedJob.status === 'completed' ? (
              <>
                {completedJobs.length > 1 && currentEmbedIndex > 0 && (
                  <button
                    className="nav-btn-top"
                    onClick={handlePrevEmbed}
                    title="Previous video"
                  >
                    <PrevUpIcon />
                  </button>
                )}

                <div className="embed-video-container">
                  <video
                    ref={videoRef}
                    key={selectedJob.id}
                    controls
                    loop
                    crossOrigin="anonymous"
                    className="embed-video-player"
                  >
                    <source src={selectedJob.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="embed-info">
                  <div className="embed-actions">
                    <button
                      className="embed-btn"
                      onClick={() => downloadVideo(selectedJob)}
                      title="Download video file"
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={() => copyPrompt(selectedJob.prompt)}
                      title="Copy prompt"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={captureFrame}
                      title="Download current frame as file"
                    >
                      <ScreenshotIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={captureFrameToGallery}
                      title="Save current frame to gallery"
                    >
                      <AddImageIcon />
                    </button>
                  </div>

                  <div className="embed-meta">
                    <span className="embed-date">
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>

                {completedJobs.length > 1 &&
                  currentEmbedIndex < completedJobs.length - 1 && (
                    <button
                      className="nav-btn-bottom"
                      onClick={handleNextEmbed}
                      title="Next video"
                    >
                      <NextDownIcon />
                    </button>
                  )}
              </>
            ) : (
              <div className="embed-placeholder">
                <div className="placeholder-icon">▶</div>
                <p>No completed videos yet. Start generating!</p>
              </div>
            )}
          </div>
        ) : (
          <div className="list-view">
            {selectedJob && selectedJob.status === 'completed' ? (
              <div className="list-embed-section">
                <div className="embed-video-container">
                  <video
                    ref={videoRef}
                    key={selectedJob.id}
                    controls
                    loop
                    crossOrigin="anonymous"
                    className="embed-video-player"
                  >
                    <source src={selectedJob.videoUrl} type="video/mp4" />
                    Your browser does not support the video tag.
                  </video>
                </div>

                <div className="embed-info">
                  <div className="embed-actions">
                    <button
                      className="embed-btn"
                      onClick={() => downloadVideo(selectedJob)}
                      title="Download video file"
                    >
                      <DownloadIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={() => copyPrompt(selectedJob.prompt)}
                      title="Copy prompt"
                    >
                      <CopyIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={captureFrame}
                      title="Download current frame as file"
                    >
                      <ScreenshotIcon />
                    </button>
                    <button
                      className="embed-btn"
                      onClick={captureFrameToGallery}
                      title="Save current frame to gallery"
                    >
                      <AddImageIcon />
                    </button>
                  </div>

                  <div className="embed-meta">
                    <span className="embed-date">
                      {new Date(selectedJob.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="embed-placeholder">
                <div className="placeholder-icon">▶</div>
                <p>No completed videos yet. Start generating!</p>
              </div>
            )}

            <div className="list-header">
              <div className="filter-chips">
                <button
                  className={`filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('all')}
                >
                  All
                </button>
                <button
                  className={`filter-chip ${
                    statusFilter === 'completed' ? 'active' : ''
                  }`}
                  onClick={() => setStatusFilter('completed')}
                >
                  Success
                </button>
                <button
                  className={`filter-chip ${statusFilter === 'failed' ? 'active' : ''}`}
                  onClick={() => setStatusFilter('failed')}
                >
                  Failed
                </button>
              </div>
            </div>

            <div className="video-list">
              {filteredJobs.length === 0 ? (
                <div className="empty-list">
                  <p>No videos match the filter</p>
                </div>
              ) : (
                filteredJobs.map((job) => (
                  <div
                    key={job.id}
                    className={`video-list-item ${
                      selectedJob?.id === job.id ? 'selected' : ''
                    }`}
                    onClick={() => job.status === 'completed' && handleVideoClick(job)}
                  >
                    <div className="list-item-thumbnail">
                      {job.status === 'completed' && job.thumbnailUrl ? (
                        <img src={job.thumbnailUrl} alt="Thumbnail" />
                      ) : (
                        <div className="thumbnail-placeholder">
                          {getStatusBadge(job.status)}
                        </div>
                      )}
                    </div>

                    <div className="list-item-info">
                      <div className="list-item-prompt">
                        {job.prompt.substring(0, 80)}...
                      </div>
                      <div className="list-item-meta">
                        {getStatusBadge(job.status)}
                        {job.cost && (
                          <span className="list-item-cost">
                            ${job.cost.toFixed(2)}
                          </span>
                        )}
                        <span className="list-item-date">
                          {new Date(job.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <button
                      ref={(el) => {
                        menuButtonRefs.current[job.id] = el;
                      }}
                      className="list-item-more-btn"
                      onClick={(e) => handleMoreClick(e, job)}
                      title="More options"
                    >
                      <MoreIcon />
                    </button>

                    {openMenuJobId === job.id && (
                      <VideoRowMenu
                        onDownload={() => handleDownloadClick(job)}
                        onCopyPrompt={() => handleCopyPromptClick(job)}
                        onDelete={() => handleDeleteClick(job)}
                        onCheckStatus={() => handleCheckStatusClick(job)}
                        showCheckStatus={job.status === 'generating'}
                        onClose={handleCloseMenu}
                        triggerRef={{ current: menuButtonRefs.current[job.id] }}
                      />
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {showDeleteConfirmation && (
        <ConfirmationModal
          title="Delete Video"
          message="Are you sure you want to delete this video? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
        />
      )}
    </div>
  );
}

export default OutputPanel;
