// Prototype persistence. Your own hands live in this browser only (localStorage); the demo
// community is regenerated from the seed. A production build replaces this module with the
// API described in docs/VISION.md, "Architecture".

import { seedDonations } from './data/seed.js';

const KEY = 'lynia.myHands.v1';

function readMine() {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]');
  } catch {
    return [];
  }
}

function writeMine(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    return false; // private mode or quota: the hand still shows for this visit
  }
}

let seed = null;
let mine = readMine();

export function allDonations() {
  seed ??= seedDonations();
  return [...seed, ...mine].sort((a, b) => a.handNo - b.handNo);
}

export function myDonations() {
  return mine;
}

export function nextHandNo() {
  return allDonations().reduce((m, d) => Math.max(m, d.handNo), 0) + 1;
}

export function addDonation(donation) {
  mine = [...mine, donation];
  const persisted = writeMine(mine);
  return { donation, persisted };
}

export function donationById(id) {
  return allDonations().find((d) => d.id === id);
}

export function forgetMine() {
  mine = [];
  writeMine(mine);
}
