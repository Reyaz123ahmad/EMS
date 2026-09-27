import fs from 'fs';
import path from 'path';
import https from 'https';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_URL = 'https://raw.githubusercontent.com/justadudewhohacks/face-api.js/master/weights';
const MODELS_DIR = path.join(__dirname, '../models/face');

const models = [
  'tiny_face_detector_model-weights_manifest.json',
  'tiny_face_detector_model-shard1',
  'face_landmark_68_model-weights_manifest.json',
  'face_landmark_68_model-shard1',
  'face_recognition_model-weights_manifest.json',
  'face_recognition_model-shard1',
  'face_recognition_model-shard2',
  'face_expression_model-weights_manifest.json',
  'face_expression_model-shard1'
];

if (!fs.existsSync(MODELS_DIR)) {
  fs.mkdirSync(MODELS_DIR, { recursive: true });
}

async function download(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    https.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        return download(response.headers.location, filepath).then(resolve).catch(reject);
      }
      if (response.statusCode !== 200) {
        reject(new Error(`Failed with status ${response.statusCode}`));
        return;
      }
      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(filepath, () => {});
      reject(err);
    });
  });
}

async function main() {
  console.log(`Downloading models to ${MODELS_DIR}...`);
  for (const model of models) {
    const url = `${MODEL_URL}/${model}`;
    const filepath = path.join(MODELS_DIR, model);
    if (fs.existsSync(filepath) && fs.statSync(filepath).size > 0) {
      console.log(`[SKIP] Already exists: ${model}`);
      continue;
    }
    console.log(`Downloading ${model}...`);
    try {
      await download(url, filepath);
      console.log(`Downloaded ${model}`);
    } catch (err) {
      console.error(`Error downloading ${model}:`, err.message);
    }
  }
  console.log('All models downloaded successfully!');
}

main().catch(console.error);
