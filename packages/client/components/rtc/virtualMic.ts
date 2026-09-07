export const stoatSinkName = "stoat-virtual-source";

export async function getVirtmic() {
  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioDevice = devices.find(
      ({ label }) => label.split(":").pop() === stoatSinkName,
    );
    return audioDevice?.deviceId;
  } catch {
    return null;
  }
}
