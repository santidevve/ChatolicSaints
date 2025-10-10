import React from 'react';

interface ShareButtonProps {
  shareData: {
    title: string;
    text: string;
    url?: string;
  };
  className?: string;
  ariaLabel: string;
}

const ShareIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12s-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
    </svg>
);

const ShareButton: React.FC<ShareButtonProps> = ({ shareData, className, ariaLabel }) => {
  const canShare = typeof navigator !== 'undefined' && !!navigator.share;

  const handleShare = async () => {
    const dataToShare = { ...shareData };

    // The Web Share API can throw an "Invalid URL" error if the URL is not a
    // valid, shareable URL (e.g., 'about:blank' in certain sandboxed environments).
    // This logic validates the URL and removes it if it's not a valid HTTP/HTTPS link,
    // allowing the share functionality to proceed with just title and text.
    if (dataToShare.url) {
        try {
            const url = new URL(dataToShare.url);
            if (url.protocol !== 'http:' && url.protocol !== 'https-:') {
                delete dataToShare.url;
            }
        } catch (_) {
            // If the URL constructor throws an error, the URL is invalid.
            delete dataToShare.url;
        }
    }

    try {
        await navigator.share(dataToShare);
    } catch (error) {
        // The user cancelling the share dialog is not an error, so we ignore AbortError.
        if (error instanceof Error && error.name !== 'AbortError') {
            console.error('Error sharing:', error);
        }
    }
  };

  if (!canShare) {
    return null;
  }

  return (
    <button
      onClick={handleShare}
      className={`p-2 rounded-full hover:bg-amber-100 text-stone-600 transition ${className}`}
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <ShareIcon />
    </button>
  );
};

export default ShareButton;
