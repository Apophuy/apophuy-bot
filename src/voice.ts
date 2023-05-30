import installer from '@ffmpeg-installer/ffmpeg';
import axios from 'axios';
import Ffmpeg from 'fluent-ffmpeg';
import { createWriteStream } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { removeFile } from './utils.js';

const __dirname = dirname(fileURLToPath(import.meta.url));

class OggConverter {
  constructor() {
    Ffmpeg.setFfmpegPath(installer.path);
  }

  toMp3(input: string | undefined, output: string): Promise<string> | undefined {
    try {
      const outputPath = resolve(dirname(input || '/temp'), `${output}.mp3`);
      return new Promise((resolve, reject) => {
        Ffmpeg(input)
          .inputOption('-t 30')
          .output(outputPath)
          .on('end', () => {
            removeFile(input || '');
            resolve(outputPath);
          })
          .on('error', (err: any) => reject(err.message))
          .run();
      });
    } catch (e: any) {
      console.error('Error while creating mp3', e.message);
    }
  }

  async create(url: string, filename: string): Promise<string | undefined> {
    try {
      const oggPath = resolve(__dirname, '../temp', `${filename}.ogg`);
      const response = await axios({
        method: 'GET',
        url,
        responseType: 'stream',
      });
      return new Promise((resolve) => {
        const stream = createWriteStream(oggPath);
        response.data.pipe(stream);
        stream.on('finish', () => resolve(oggPath));
      });
    } catch (e: any) {
      console.error('Error while creating ogg', e.message);
    }
  }
}

export const ogg = new OggConverter();
