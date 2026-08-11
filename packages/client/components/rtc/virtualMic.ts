export const stoatSinkName = "stoat-virtual-source";

export function setupVirtualMic() {
  if (window.native?.isWayland?.()) {
    const original = navigator.mediaDevices.getDisplayMedia;

    async function getVirtmic() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioDevice = devices.find(
          ({ label }) => label === stoatSinkName,
        );
        return audioDevice?.deviceId;
      } catch {
        return null;
      }
    }

    navigator.mediaDevices.getDisplayMedia = async function (opts) {
      const stream: MediaStream = await original.call(this, opts);
      if (opts && !opts.audio) return stream;
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

      return stream;
    };
  }
}
