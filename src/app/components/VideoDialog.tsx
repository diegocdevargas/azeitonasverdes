import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "./ui/dialog";

type VideoDialogProps = {
  video: { title: string; year: string; videoSrc?: string } | null;
  onClose: () => void;
};

// Lazy-loaded from App.tsx so Radix Dialog (+ scroll lock) isn't part of the initial bundle
export default function VideoDialog({ video, onClose }: VideoDialogProps) {
  return (
    <Dialog open={!!video} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[100%] xl:max-w-[45%] px- border-border bg-background p-0 overflow-hidden gap-0">
        {video && (
          <>
            <DialogHeader className="dialog-header border-b border-border px-5 py-4 bg-transparent">
              <DialogTitle className="font-['Anton'] text-2xl uppercase tracking-wide text-foreground gap-0">{video.title}</DialogTitle>
              <DialogDescription className="font-['Share_Tech_Mono'] text-[10px] tracking-[0.18em] uppercase text-muted-foreground">
                Ao vivo · {video.year}
              </DialogDescription>
            </DialogHeader>

            <div className="bg-black dialog-video">
              <video
                key={video.title}
                src={video.videoSrc}
                controls
                autoPlay
                playsInline

                className="w-full h-auto max-h-[75vh] object-contain"
              />
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
