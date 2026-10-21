import { collection, deleteDoc, doc, onSnapshot, setDoc, writeBatch } from 'firebase/firestore';
import { db } from '../../lib/firebaseConfig.js';
import { WorkoutTemplate } from '../../types/index.js';
import { parseTemplate } from '../../utils/parse.utils.js';

const COLLECTION_NAME = 'templates';

/** Custom templates of one account: users/{uid}/templates, the document id is the template id. */
const templates = (uid: string) => collection(db, 'users', uid, COLLECTION_NAME);

/** The template id is the document id, so it is not stored in the document. */
const templateWrite = (uid: string, { id, ...data }: WorkoutTemplate) => [doc(templates(uid), id), data] as const;

const logged = async (operation: string, action: () => Promise<void>): Promise<void> => {
  try {
    await action();
  } catch (err) {
    console.error(`TemplatesService.${operation} error:`, err);
    throw err;
  }
};

export class TemplatesService {
  /** Streams the valid custom templates; documents with an unexpected shape are skipped and reported by id. */
  static subscribe(
    uid: string,
    onChange: (templates: WorkoutTemplate[]) => void,
    onError: (error: unknown) => void,
  ): () => void {
    return onSnapshot(
      templates(uid),
      snapshot => {
        onChange(
          snapshot.docs.flatMap(document => {
            const template = parseTemplate(document.id, document.data());
            if (!template) {
              console.warn('TemplatesService.subscribe: skipped invalid document', document.id);
              return [];
            }
            return [template];
          }),
        );
      },
      error => {
        console.error('TemplatesService.subscribe error:', error);
        onError(error);
      },
    );
  }

  /** Writes the template under its own id, so saving it again overwrites the same document. */
  static save(uid: string, template: WorkoutTemplate): Promise<void> {
    return logged('save', () => setDoc(...templateWrite(uid, template)));
  }

  static delete(uid: string, id: string): Promise<void> {
    return logged('delete', () => deleteDoc(doc(templates(uid), id)));
  }

  /** Stores several templates in one atomic write; existing documents with the same id are overwritten. */
  static saveAll(uid: string, items: WorkoutTemplate[]): Promise<void> {
    return logged('saveAll', async () => {
      const batch = writeBatch(db);
      for (const template of items) batch.set(...templateWrite(uid, template));
      await batch.commit();
    });
  }
}
