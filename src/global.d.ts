interface StorageData {
  get(key: string): Promise<{ value?: string } | undefined>;
  set(key: string, value: string): Promise<void>;
}

interface Window {
  storage?: StorageData;
}