import { useParams } from "react-router";
import {
  getOrCreateMyPeer,
  getMediaStream,
  isHost,
  getHostId,
} from "../../services/peerjs";
import React from "react";
import Peer from "peerjs";
import VideoElement from "./_components/video-element";
import { useState } from "react";

export default function Call() {
  const { id } = useParams();
  const callId = id;
  const myVideoRef = React.useRef<HTMLVideoElement>(null);
  const [myPeer, setMyPeer] = React.useState<Peer | null>(null);
  const [videoStatus, setVideoStatus] = useState(true);
  const [micStatus, setMicStatus] = useState(true);
  const [connectedStreams, setConnectedStreams] = React.useState<MediaStream[]>(
    []
  );

  React.useEffect(() => {
    (async () => {
      if (!callId) {
        throw new Error("No id");
      }

      const createdPeer = await getOrCreateMyPeer(callId);
      setMyPeer(createdPeer);

      const myStream = await getMediaStream();
      if (myVideoRef.current) {
        myVideoRef.current.srcObject = myStream;
      }

      createdPeer.on("call", (call) => {
        call.answer(myStream);
        call.on("stream", (otherStream) => {
          setConnectedStreams((current) => [...current, otherStream]);
        });
      });

      if (!isHost(createdPeer.id)) {
        setTimeout(() => {
          const userToCall = getHostId(createdPeer.id);
          const call = createdPeer!.call(userToCall, myStream);
          call.on("stream", (otherStream) => {
            setConnectedStreams((current) => [...current, otherStream]);
          });
        }, 2000);
      }
    })();
  }, []);

  const handleMicrophone = () => {
    const videoRef = myVideoRef.current;
    if (videoRef && videoRef.srcObject instanceof MediaStream) {
      const tracks = videoRef.srcObject.getAudioTracks();
      setMicStatus(!micStatus);
      tracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  const handleVideo = () => {
    const videoRef = myVideoRef.current;
    if (videoRef && videoRef.srcObject instanceof MediaStream) {
      const tracks = videoRef.srcObject.getVideoTracks();
      setVideoStatus(!videoStatus);
      tracks.forEach((track) => {
        track.enabled = !track.enabled;
      });
    }
  };

  return (
    <div>
      <div className="flex grid font-mono h-max ontent-center p-20  ">
        <h1 className=" h2 text-center text-2xl m-2">
          Here is call the call, I am {myPeer?.id}.
        </h1>
        <div className="grid xl:grid-cols-2 sm:grid-cols-1 gap-6 p-5  grow">
          <div className="w-full aspect-video  ">
            <video
              className="  border-solid border-2  rounded-xl shadow-md w-full  aspect-auto object-contain "
              ref={myVideoRef}
              autoPlay
              muted
              playsInline
            />
            <div className="flex justify-around">
              <button
                className=" bg-gray-50 hover:bg-gray-100 active:bg-gray-200  rounded-md shadow-md cursor-pointer m-2 w-1/4"
                onClick={handleMicrophone}
              >
                {micStatus ? "Mic On" : "Mic Off"}
              </button>
              <button
                className="bg-gray-50 hover:bg-gray-100 active:bg-gray-200 rounded-md shadow-md cursor-pointer m-2 w-1/4"
                onClick={handleVideo}
              >
                {videoStatus ? "Video On" : "Video Off"}
              </button>
            </div>
          </div>
        </div>
        {connectedStreams
          .filter((_, i) => {
            if (connectedStreams[i]?.id != connectedStreams[i + 1]?.id) {
              return true;
            }
          })
          .map((stream, index) => (
            <VideoElement key={index} stream={stream} />
          ))}
      </div>
    </div>
  );
}
