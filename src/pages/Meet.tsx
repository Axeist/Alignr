import { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Video, Mic, MicOff, VideoOff, Monitor, X, Users } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function Meet() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const jitsiApiRef = useRef<any>(null);

  useEffect(() => {
    if (!roomId || !jitsiContainerRef.current) return;

    // Load Jitsi Meet API
    const script = document.createElement("script");
    script.src = "https://8x8.vc/external_api.js";
    script.async = true;
    script.onload = () => {
      if (window.JitsiMeetExternalAPI && jitsiContainerRef.current) {
        const domain = "meet.jit.si"; // Using public Jitsi instance
        const options = {
          roomName: roomId,
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            enableWelcomePage: false,
            enableClosePage: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              "microphone",
              "camera",
              "closedcaptions",
              "desktop",
              "fullscreen",
              "fodeviceselection",
              "hangup",
              "profile",
              "chat",
              "recording",
              "livestreaming",
              "settings",
              "raisehand",
              "videoquality",
              "filmstrip",
              "invite",
              "feedback",
              "stats",
              "shortcuts",
              "tileview",
              "videobackgroundblur",
              "download",
              "help",
              "mute-everyone",
              "security",
            ],
            SETTINGS_SECTIONS: ["devices", "language", "moderator", "profile"],
            DEFAULT_BACKGROUND: "#1a1a1a",
          },
          userInfo: {
            displayName: user?.user_metadata?.full_name || user?.email || "Participant",
            email: user?.email || "",
          },
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        jitsiApiRef.current = api;

        // Event listeners
        api.addEventListener("videoConferenceJoined", () => {
          console.log("Joined conference");
        });

        api.addEventListener("participantJoined", () => {
          setParticipantCount((prev) => prev + 1);
        });

        api.addEventListener("participantLeft", () => {
          setParticipantCount((prev) => Math.max(1, prev - 1));
        });

        api.addEventListener("readyToClose", () => {
          navigate("/");
        });
      }
    };
    document.head.appendChild(script);

    return () => {
      // Cleanup
      if (jitsiApiRef.current) {
        jitsiApiRef.current.dispose();
        jitsiApiRef.current = null;
      }
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };
  }, [roomId, user, navigate]);

  const handleMuteToggle = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleAudio");
      setIsMuted(!isMuted);
    }
  };

  const handleVideoToggle = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleVideo");
      setIsVideoOff(!isVideoOff);
    }
  };

  const handleScreenShare = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("toggleShareScreen");
      setIsScreenSharing(!isScreenSharing);
    }
  };

  const handleLeave = () => {
    if (jitsiApiRef.current) {
      jitsiApiRef.current.executeCommand("hangup");
    }
    navigate("/");
  };

  return (
    <div className="h-screen w-screen bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold">Alignr Meeting</h1>
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <Users className="h-4 w-4" />
            <span>{participantCount} participant{participantCount !== 1 ? "s" : ""}</span>
          </div>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleLeave}
          className="text-white hover:bg-gray-800"
        >
          <X className="h-4 w-4 mr-2" />
          Leave Meeting
        </Button>
      </div>

      {/* Jitsi Container */}
      <div className="flex-1 relative" ref={jitsiContainerRef} />

      {/* Custom Controls (optional, Jitsi has built-in controls) */}
      <div className="bg-gray-900 p-4 flex items-center justify-center gap-4">
        <Button
          variant={isMuted ? "destructive" : "outline"}
          size="lg"
          onClick={handleMuteToggle}
          className="text-white border-gray-600 hover:bg-gray-800"
        >
          {isMuted ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
        </Button>
        <Button
          variant={isVideoOff ? "destructive" : "outline"}
          size="lg"
          onClick={handleVideoToggle}
          className="text-white border-gray-600 hover:bg-gray-800"
        >
          {isVideoOff ? <VideoOff className="h-5 w-5" /> : <Video className="h-5 w-5" />}
        </Button>
        <Button
          variant={isScreenSharing ? "default" : "outline"}
          size="lg"
          onClick={handleScreenShare}
          className="text-white border-gray-600 hover:bg-gray-800"
        >
          <Monitor className="h-5 w-5" />
        </Button>
        <Button
          variant="destructive"
          size="lg"
          onClick={handleLeave}
          className="bg-red-600 hover:bg-red-700"
        >
          Leave Meeting
        </Button>
      </div>
    </div>
  );
}

// Extend Window interface for Jitsi
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

