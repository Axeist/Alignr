import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar, Clock, User, Video, MapPin, Phone } from "lucide-react";
import { useState } from "react";

interface ShortlistInterviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application: any;
  onProceed: (meetingLink: string) => void;
  onRequestReschedule: () => void;
}

export function ShortlistInterviewModal({
  open,
  onOpenChange,
  application,
  onProceed,
  onRequestReschedule,
}: ShortlistInterviewModalProps) {
  const [meetingLink, setMeetingLink] = useState("");
  
  // Check if student has proposed interview date/time
  // For now, we'll check if there's an existing interview record
  const hasProposedSchedule = application?.interview?.interview_date && application?.interview?.interview_time;
  
  // Reset meeting link when modal opens/closes
  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      setMeetingLink("");
    }
    onOpenChange(isOpen);
  };
  
  const handleProceed = () => {
    if (!meetingLink.trim()) {
      return; // Validation will be handled by the button's disabled state
    }
    onProceed(meetingLink.trim());
  };
  
  const proposedDate = hasProposedSchedule 
    ? new Date(application.interview.interview_date).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;
  
  const proposedTime = hasProposedSchedule
    ? new Date(`2000-01-01T${application.interview.interview_time}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      })
    : null;

  const getModeIcon = (mode: string) => {
    switch (mode) {
      case "online":
      case "video_call":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "offline":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Schedule Interview</DialogTitle>
          <DialogDescription>
            Choose how you want to proceed with {application?.profiles?.full_name || "this candidate"}'s interview for {application?.jobs?.title || "this position"}.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* Meeting Link Input */}
          <div className="space-y-2">
            <Label htmlFor="meeting_link" className="text-sm font-semibold">
              Meeting Link <span className="text-red-400">*</span>
            </Label>
            <Input
              id="meeting_link"
              type="url"
              placeholder="https://meet.alignr.in/room-id or https://meet.google.com/xxx-xxxx-xxx"
              value={meetingLink}
              onChange={(e) => setMeetingLink(e.target.value)}
              className="w-full"
              required
            />
            <p className="text-xs text-gray-400">
              Please provide the meeting link for this interview. This can be a Google Meet, Zoom, or any other video conferencing link.
            </p>
          </div>
          {hasProposedSchedule && (
            <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Student's Proposed Schedule
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-300">
                  <Calendar className="h-4 w-4 text-blue-400" />
                  <span><strong>Date:</strong> {proposedDate}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-300">
                  <Clock className="h-4 w-4 text-blue-400" />
                  <span><strong>Time:</strong> {proposedTime}</span>
                </div>
                {application.interview?.mode && (
                  <div className="flex items-center gap-2 text-gray-300">
                    {getModeIcon(application.interview.mode)}
                    <span><strong>Mode:</strong> {application.interview.mode.charAt(0).toUpperCase() + application.interview.mode.slice(1)}</span>
                  </div>
                )}
                {application.interview?.location && (
                  <div className="flex items-center gap-2 text-gray-300">
                    <MapPin className="h-4 w-4 text-blue-400" />
                    <span><strong>Location:</strong> {application.interview.location}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {!hasProposedSchedule && (
            <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
              <p className="text-sm text-yellow-400">
                <strong>Note:</strong> The student hasn't proposed a specific interview schedule yet. 
                If you proceed, the interview will be scheduled with the meeting link you provide, and the student will be notified.
              </p>
            </div>
          )}

          <div className="space-y-3">
            <Button
              onClick={handleProceed}
              disabled={!meetingLink.trim()}
              className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              size="lg"
            >
              {hasProposedSchedule 
                ? "Proceed with Student's Proposed Date & Time"
                : "Proceed with Interview Scheduling"}
            </Button>
            
            <Button
              onClick={onRequestReschedule}
              variant="outline"
              className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
              size="lg"
            >
              Request for Reschedule
            </Button>
          </div>

          <div className="text-xs text-gray-400 pt-4 border-t border-gray-700">
            <p>
              <strong>Proceed:</strong> The interview will be scheduled with the provided meeting link, 
              and both you and the student will receive email notifications with interview details.
            </p>
            <p className="mt-2">
              <strong>Request Reschedule:</strong> The student will be notified to propose a new date and time.
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

