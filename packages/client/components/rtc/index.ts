import { getVirtmic } from "./virtualMic";

export { useVoice, VoiceContext } from "./state";

export { InRoom } from "./components/InRoom";
export { RoomAudioManager } from "./components/RoomAudioManager";
export { stoatSinkName } from "./virtualMic";

if (typeof window !== "undefined" && navigator.mediaDevices) {
  const originalMediaCall = navigator.mediaDevices.getDisplayMedia;

  navigator.mediaDevices.getDisplayMedia = async function (opts) {
    const stream: MediaStream = await originalMediaCall.call(this, opts);

    let isWayland = false;
    if (window.native?.isWayland) {
      try {
        isWayland = await window.native.isWayland();
      } catch {
        isWayland = false;
      }
    }

    if (opts && opts.audio && isWayland) {
      const id = await getVirtmic();

      console.debug("Virt mic acquired:", id);

      if (id) {
        const audio = await navigator.mediaDevices.getUserMedia({
          audio: {
            deviceId: {
              exact: id,
            },
            autoGainControl: false,
            echoCancellation: false,
            noiseSuppression: false,
            channelCount: 2,
            sampleRate: 48000,
            sampleSize: 16,
          },
        });

        stream.getAudioTracks().forEach((t) => stream.removeTrack(t));
        stream.addTrack(audio.getAudioTracks()[0]);
      }
    }

    return stream;
  };
}
