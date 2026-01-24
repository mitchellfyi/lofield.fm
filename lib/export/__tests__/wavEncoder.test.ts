import { describe, it, expect } from "vitest";
import { encodeWav } from "../wavEncoder";

describe("wavEncoder", () => {
  describe("encodeWav", () => {
    /**
     * Helper function to convert Blob to ArrayBuffer (jsdom compatible)
     */
    async function blobToArrayBuffer(blob: Blob): Promise<ArrayBuffer> {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as ArrayBuffer);
        reader.onerror = () => reject(reader.error);
        reader.readAsArrayBuffer(blob);
      });
    }

    /**
     * Helper function to create a mock AudioBuffer
     */
    function createMockAudioBuffer(
      numChannels: number,
      numSamples: number,
      sampleRate: number,
      channelData?: Float32Array[]
    ): AudioBuffer {
      const data: Float32Array[] =
        channelData ||
        Array.from({ length: numChannels }, () => new Float32Array(numSamples).fill(0));

      return {
        numberOfChannels: numChannels,
        length: numSamples,
        sampleRate,
        duration: numSamples / sampleRate,
        getChannelData: (channel: number) => data[channel],
        copyFromChannel: () => {},
        copyToChannel: () => {},
      } as unknown as AudioBuffer;
    }

    describe("WAV header format", () => {
      it("should produce a Blob with audio/wav MIME type", () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);

        expect(blob).toBeInstanceOf(Blob);
        expect(blob.type).toBe("audio/wav");
      });

      it("should include RIFF header identifier", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // RIFF header at offset 0-3
        const riff = String.fromCharCode(
          view.getUint8(0),
          view.getUint8(1),
          view.getUint8(2),
          view.getUint8(3)
        );
        expect(riff).toBe("RIFF");
      });

      it("should include WAVE format identifier", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // WAVE format at offset 8-11
        const wave = String.fromCharCode(
          view.getUint8(8),
          view.getUint8(9),
          view.getUint8(10),
          view.getUint8(11)
        );
        expect(wave).toBe("WAVE");
      });

      it("should include fmt sub-chunk identifier", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // "fmt " at offset 12-15
        const fmt = String.fromCharCode(
          view.getUint8(12),
          view.getUint8(13),
          view.getUint8(14),
          view.getUint8(15)
        );
        expect(fmt).toBe("fmt ");
      });

      it("should include data sub-chunk identifier", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // "data" at offset 36-39
        const data = String.fromCharCode(
          view.getUint8(36),
          view.getUint8(37),
          view.getUint8(38),
          view.getUint8(39)
        );
        expect(data).toBe("data");
      });

      it("should set audio format to 1 (PCM)", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Audio format at offset 20-21 (little-endian)
        const audioFormat = view.getUint16(20, true);
        expect(audioFormat).toBe(1);
      });

      it("should set bits per sample to 16", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Bits per sample at offset 34-35 (little-endian)
        const bitsPerSample = view.getUint16(34, true);
        expect(bitsPerSample).toBe(16);
      });
    });

    describe("channel handling", () => {
      it("should correctly encode mono audio (1 channel)", async () => {
        const buffer = createMockAudioBuffer(1, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Number of channels at offset 22-23
        const numChannels = view.getUint16(22, true);
        expect(numChannels).toBe(1);
      });

      it("should correctly encode stereo audio (2 channels)", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Number of channels at offset 22-23
        const numChannels = view.getUint16(22, true);
        expect(numChannels).toBe(2);
      });

      it("should correctly set block align for mono", async () => {
        const buffer = createMockAudioBuffer(1, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Block align at offset 32-33 (numChannels * bitsPerSample / 8)
        const blockAlign = view.getUint16(32, true);
        expect(blockAlign).toBe(2); // 1 channel * 2 bytes
      });

      it("should correctly set block align for stereo", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Block align at offset 32-33
        const blockAlign = view.getUint16(32, true);
        expect(blockAlign).toBe(4); // 2 channels * 2 bytes
      });
    });

    describe("sample rate handling", () => {
      it("should correctly encode 44100 Hz sample rate", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Sample rate at offset 24-27 (little-endian)
        const sampleRate = view.getUint32(24, true);
        expect(sampleRate).toBe(44100);
      });

      it("should correctly encode 48000 Hz sample rate", async () => {
        const buffer = createMockAudioBuffer(2, 100, 48000);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        const sampleRate = view.getUint32(24, true);
        expect(sampleRate).toBe(48000);
      });

      it("should correctly set byte rate for 44100 Hz stereo", async () => {
        const buffer = createMockAudioBuffer(2, 100, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Byte rate at offset 28-31 (sampleRate * numChannels * bitsPerSample / 8)
        const byteRate = view.getUint32(28, true);
        expect(byteRate).toBe(44100 * 2 * 2); // 176400
      });
    });

    describe("file size calculation", () => {
      it("should correctly calculate total file size", async () => {
        const numChannels = 2;
        const numSamples = 100;
        const bytesPerSample = 2; // 16-bit
        const headerSize = 44;
        const dataSize = numSamples * numChannels * bytesPerSample;
        const expectedSize = headerSize + dataSize;

        const buffer = createMockAudioBuffer(numChannels, numSamples, 44100);
        const blob = encodeWav(buffer);

        expect(blob.size).toBe(expectedSize);
      });

      it("should correctly set RIFF chunk size", async () => {
        const numChannels = 2;
        const numSamples = 100;
        const bytesPerSample = 2;
        const dataSize = numSamples * numChannels * bytesPerSample;
        // RIFF chunk size = file size - 8 = 36 + dataSize
        const expectedChunkSize = 36 + dataSize;

        const buffer = createMockAudioBuffer(numChannels, numSamples, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        const chunkSize = view.getUint32(4, true);
        expect(chunkSize).toBe(expectedChunkSize);
      });

      it("should correctly set data sub-chunk size", async () => {
        const numChannels = 2;
        const numSamples = 100;
        const bytesPerSample = 2;
        const expectedDataSize = numSamples * numChannels * bytesPerSample;

        const buffer = createMockAudioBuffer(numChannels, numSamples, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Data size at offset 40-43
        const dataSize = view.getUint32(40, true);
        expect(dataSize).toBe(expectedDataSize);
      });
    });

    describe("audio data encoding", () => {
      it("should correctly encode silence (zeros)", async () => {
        const buffer = createMockAudioBuffer(1, 10, 44100);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Check first few samples after header (offset 44)
        for (let i = 0; i < 10; i++) {
          const sample = view.getInt16(44 + i * 2, true);
          expect(sample).toBe(0);
        }
      });

      it("should correctly encode positive values", async () => {
        const channelData = [new Float32Array([0.5, 1.0, 0.25])];
        const buffer = createMockAudioBuffer(1, 3, 44100, channelData);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // 0.5 -> approximately 16383 (0.5 * 32767)
        const sample1 = view.getInt16(44, true);
        expect(sample1).toBeCloseTo(16383, -1);

        // 1.0 -> 32767 (max positive)
        const sample2 = view.getInt16(46, true);
        expect(sample2).toBe(32767);

        // 0.25 -> approximately 8191 (0.25 * 32767)
        const sample3 = view.getInt16(48, true);
        expect(sample3).toBeCloseTo(8191, -1);
      });

      it("should correctly encode negative values", async () => {
        const channelData = [new Float32Array([-0.5, -1.0, -0.25])];
        const buffer = createMockAudioBuffer(1, 3, 44100, channelData);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // -0.5 -> approximately -16384 (-0.5 * 32768)
        const sample1 = view.getInt16(44, true);
        expect(sample1).toBeCloseTo(-16384, -1);

        // -1.0 -> -32768 (min negative)
        const sample2 = view.getInt16(46, true);
        expect(sample2).toBe(-32768);

        // -0.25 -> approximately -8192 (-0.25 * 32768)
        const sample3 = view.getInt16(48, true);
        expect(sample3).toBeCloseTo(-8192, -1);
      });

      it("should clamp values above 1.0", async () => {
        const channelData = [new Float32Array([1.5, 2.0])];
        const buffer = createMockAudioBuffer(1, 2, 44100, channelData);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Values above 1.0 should be clamped to 32767
        const sample1 = view.getInt16(44, true);
        const sample2 = view.getInt16(46, true);
        expect(sample1).toBe(32767);
        expect(sample2).toBe(32767);
      });

      it("should clamp values below -1.0", async () => {
        const channelData = [new Float32Array([-1.5, -2.0])];
        const buffer = createMockAudioBuffer(1, 2, 44100, channelData);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Values below -1.0 should be clamped to -32768
        const sample1 = view.getInt16(44, true);
        const sample2 = view.getInt16(46, true);
        expect(sample1).toBe(-32768);
        expect(sample2).toBe(-32768);
      });

      it("should correctly interleave stereo channels", async () => {
        // Left channel: [0.5, 0.25], Right channel: [-0.5, -0.25]
        const channelData = [
          new Float32Array([0.5, 0.25]),
          new Float32Array([-0.5, -0.25]),
        ];
        const buffer = createMockAudioBuffer(2, 2, 44100, channelData);
        const blob = encodeWav(buffer);
        const arrayBuffer = await blobToArrayBuffer(blob);
        const view = new DataView(arrayBuffer);

        // Sample 0: Left then Right
        const left0 = view.getInt16(44, true);
        const right0 = view.getInt16(46, true);
        expect(left0).toBeCloseTo(16383, -1); // 0.5 * 32767
        expect(right0).toBeCloseTo(-16384, -1); // -0.5 * 32768

        // Sample 1: Left then Right
        const left1 = view.getInt16(48, true);
        const right1 = view.getInt16(50, true);
        expect(left1).toBeCloseTo(8191, -1); // 0.25 * 32767
        expect(right1).toBeCloseTo(-8192, -1); // -0.25 * 32768
      });
    });
  });
});
