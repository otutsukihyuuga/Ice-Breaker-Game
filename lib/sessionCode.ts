import { customAlphabet } from "nanoid";

const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const gen = customAlphabet(alphabet, 6);

export function createSessionCode() {
  return gen();
}
