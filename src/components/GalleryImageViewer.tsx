import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ChevronLeft, ChevronRight, Download } from "lucide-react";
import { useState, useEffect } from "react";

interface GallerySubmission {
  id: string;
  title: string;
  description: string | null;
  file_path: string;
  file_type: string;
  created_at: string;
}

interface GalleryImageViewerProps {
  submissions: GallerySubmission[];
  currentIndex: number;
  isOpen: boolean;
  onClose: () => void;
  getFileUrl: (path: string) => string;
}

export const GalleryImageViewer = ({
  submissions,
  currentIndex,
  isOpen,
  onClose,
  getFileUrl,
}: GalleryImageViewerProps) => {
  const [index, setIndex] = useState(currentIndex);

  useEffect(() => {
    setIndex(currentIndex);
  }, [currentIndex]);

  const handlePrevious = () => {
    setIndex((prev) => (prev > 0 ? prev - 1 : submissions.length - 1));
  };

  const handleNext = () => {
    setIndex((prev) => (prev < submissions.length - 1 ? prev + 1 : 0));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === "ArrowLeft") handlePrevious();
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, index]);

  if (!submissions[index]) return null;

  const currentSubmission = submissions[index];
  const isVideo = currentSubmission.file_type.startsWith("video/");

  const handleDownload = async () => {
    const url = getFileUrl(currentSubmission.file_path);
    const link = document.createElement("a");
    link.href = url;
    link.download = currentSubmission.title;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl w-[95vw] h-[95vh] p-0 bg-black/95 border-none">
        <div className="relative w-full h-full flex flex-col">
          {/* Header */}
          <div className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-black/80 to-transparent p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1 mr-4">
                <h2 className="text-xl font-bold text-white mb-1">
                  {currentSubmission.title}
                </h2>
                {currentSubmission.description && (
                  <p className="text-sm text-white/70">
                    {currentSubmission.description}
                  </p>
                )}
                <p className="text-xs text-white/50 mt-1">
                  {new Date(currentSubmission.created_at).toLocaleDateString()}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleDownload}
                  className="text-white hover:bg-white/10"
                >
                  <Download className="h-5 w-5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="text-white hover:bg-white/10"
                >
                  <X className="h-5 w-5" />
                </Button>
              </div>
            </div>
          </div>

          {/* Media Content */}
          <div className="flex-1 flex items-center justify-center p-6 pt-24 pb-20">
            {isVideo ? (
              <video
                src={getFileUrl(currentSubmission.file_path)}
                controls
                autoPlay
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            ) : (
              <img
                src={getFileUrl(currentSubmission.file_path)}
                alt={currentSubmission.title}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            )}
          </div>

          {/* Navigation */}
          {submissions.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 h-12 w-12"
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            </>
          )}

          {/* Footer Counter */}
          {submissions.length > 1 && (
            <div className="absolute bottom-0 left-0 right-0 z-50 bg-gradient-to-t from-black/80 to-transparent p-6">
              <div className="text-center text-white/70 text-sm">
                {index + 1} / {submissions.length}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
