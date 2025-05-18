const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const os = require('os');
const path = require('path');

function extractAudio(videoBuffer) {
  return new Promise((resolve, reject) => {
    const tempInput = path.join(os.tmpdir(), `input_${Date.now()}.mp4`);
    const tempOutput = path.join(os.tmpdir(), `output_${Date.now()}.mp3`);

    fs.writeFileSync(tempInput, videoBuffer);

    ffmpeg(tempInput)
      .noVideo()
      .audioCodec('libmp3lame')
      .audioQuality(4)
      .save(tempOutput)
      .on('end', () => {
        const audioBuffer = fs.readFileSync(tempOutput);
        fs.unlinkSync(tempInput);
        fs.unlinkSync(tempOutput);
        resolve(audioBuffer);
      })
      .on('error', (err) => {
        if (fs.existsSync(tempInput)) fs.unlinkSync(tempInput);
        if (fs.existsSync(tempOutput)) fs.unlinkSync(tempOutput);
        reject(err);
      });
  });
}

module.exports = { extractAudio };
