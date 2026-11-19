import { collection, deleteDoc, doc, onSnapshot, setDoc } from 'firebase/firestore';
import { auth, db } from '../../lib/firebaseConfig.js';
import { ExerciseVideo, ExerciseVideoDocument } from '../../types/index.js';
import { parseExerciseVideo } from '../../utils/parse.utils.js';
import { exerciseVideoId } from './exerciseVideo.utils.js';

const COLLECTION_NAME = 'exerciseVideos';
const FUNCTION_URL = '/api/exercise-videos';

/** Technique videos shared by all active accounts: exerciseVideos/{sha256 of the exercise} (ADR-0019). */
const videos = () => collection(db, COLLECTION_NAME);

const logged = async <T>(operation: string, action: () => Promise<T>): Promise<T> => {
  try {
    return await action();
  } catch (err) {
    console.error(`ExerciseVideosService.${operation} error:`, err);
    throw err;
  }
};

/** Calls the Vercel function (api/exercise-videos.ts) as the signed-in account. */
const callFunction = async (action: 'upload' | 'view' | 'delete', mediaId: string): Promise<Response> => {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw new Error('No signed-in user');
  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, mediaId }),
  });
  if (!response.ok) throw new Error(`${action} failed with status ${response.status}`);
  return response;
};

/** The Vercel function holds the Supabase key and answers with a signed URL. */
const signedUrl = async (action: 'upload' | 'view', mediaId: string): Promise<string> => {
  const response = await callFunction(action, mediaId);
  const body: unknown = await response.json();
  if (typeof body !== 'object' || body === null || !('url' in body) || typeof body.url !== 'string') {
    throw new Error(`Unexpected ${action} response`);
  }
  return body.url;
};

export class ExerciseVideosService {
  /** Streams all valid videos; documents with an unexpected shape are skipped and reported by id. */
  static subscribe(onChange: (videos: ExerciseVideo[]) => void, onError: (error: unknown) => void): () => void {
    return onSnapshot(
      videos(),
      snapshot => {
        onChange(
          snapshot.docs.flatMap(document => {
            const video = parseExerciseVideo(document.id, document.data());
            if (!video) {
              console.warn('ExerciseVideosService.subscribe: skipped invalid document', document.id);
              return [];
            }
            return [video];
          }),
        );
      },
      error => {
        console.error('ExerciseVideosService.subscribe error:', error);
        onError(error);
      },
    );
  }

  /** Sends the file to the private bucket under `{mediaId}.mp4`; an existing file is never overwritten. */
  static uploadFile(mediaId: string, file: Blob): Promise<void> {
    return logged('uploadFile', async () => {
      const url = await signedUrl('upload', mediaId);
      const response = await fetch(url, {
        method: 'PUT',
        headers: { 'Content-Type': 'video/mp4', 'Cache-Control': 'max-age=3600', 'x-upsert': 'false' },
        body: file,
      });
      if (!response.ok) throw new Error(`Upload failed with status ${response.status}`);
    });
  }

  /** A link valid for a few minutes, for the video element. */
  static playbackUrl(mediaId: string): Promise<string> {
    return logged('playbackUrl', () => signedUrl('view', mediaId));
  }

  /** Removing a file that is already gone succeeds, so a failed deletion can be repeated. */
  static deleteFile(mediaId: string): Promise<void> {
    return logged('deleteFile', async () => {
      await callFunction('delete', mediaId);
    });
  }

  /** Writes the video of the exercise; a new video of the same exercise replaces the document. */
  static save(video: ExerciseVideoDocument): Promise<void> {
    return logged('save', async () => {
      await setDoc(doc(videos(), await exerciseVideoId(video.exerciseName)), video);
    });
  }

  static delete(id: string): Promise<void> {
    return logged('delete', () => deleteDoc(doc(videos(), id)));
  }
}
