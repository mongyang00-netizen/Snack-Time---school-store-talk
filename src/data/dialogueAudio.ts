import turn1Clerk from '../assets/audio/turn1_clerk.mp3';
import turn1Normal from '../assets/audio/turn1_target_normal.mp3';
import turn1Slow from '../assets/audio/turn1_target_slow.mp3';

import turn2Clerk from '../assets/audio/turn2_clerk.mp3';
import turn2Normal from '../assets/audio/turn2_target_normal.mp3';
import turn2Slow from '../assets/audio/turn2_target_slow.mp3';

import turn3Clerk from '../assets/audio/turn3_clerk.mp3';
import turn3Normal from '../assets/audio/turn3_target_normal.mp3';
import turn3Slow from '../assets/audio/turn3_target_slow.mp3';

import turn4Clerk from '../assets/audio/turn4_clerk.mp3';
import turn4Normal from '../assets/audio/turn4_target_normal.mp3';
import turn4Slow from '../assets/audio/turn4_target_slow.mp3';

import turn5Clerk from '../assets/audio/turn5_clerk.mp3';
import turn5Normal from '../assets/audio/turn5_target_normal.mp3';
import turn5Slow from '../assets/audio/turn5_target_slow.mp3';

export interface DialogueAudioPaths {
  clerk: string;
  targetNormal: string;
  targetSlow: string;
}

export const DIALOGUE_AUDIO: Record<number, DialogueAudioPaths> = {
  1: {
    clerk: turn1Clerk,
    targetNormal: turn1Normal,
    targetSlow: turn1Slow,
  },
  2: {
    clerk: turn2Clerk,
    targetNormal: turn2Normal,
    targetSlow: turn2Slow,
  },
  3: {
    clerk: turn3Clerk,
    targetNormal: turn3Normal,
    targetSlow: turn3Slow,
  },
  4: {
    clerk: turn4Clerk,
    targetNormal: turn4Normal,
    targetSlow: turn4Slow,
  },
  5: {
    clerk: turn5Clerk,
    targetNormal: turn5Normal,
    targetSlow: turn5Slow,
  },
};
