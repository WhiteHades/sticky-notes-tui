export interface Note {
  content: string;
  note_id: string;
  x: number;
  y: number;
  z: number;
  createdAt: number;
  updatedAt: number;
}

export interface StorageLoadResult {
  notes: Note[];
  imported: boolean;
  path: string;
}
