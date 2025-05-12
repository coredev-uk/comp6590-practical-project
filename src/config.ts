import { google } from "@ai-sdk/google";

export const FEW_SHOT_EXAMPLES = [
  "I have cities but no houses... A map.",
  "What has to be broken before you can use it? An egg.",
] as string[];

export const TEMPLATES = [
  "What has keys but can't open locks?|A piano.|Object",
  "I speak without a mouth and hear without ears. I have no body, but I come alive with the wind.|An echo.|Phenomenon",
  "The more you take, the more you leave behind. What am I?|Footsteps.|Concept",
  "I’m tall when I’m young, and I’m short when I’m old. What am I?|A candle.|Object",
  "What can travel around the world while staying in a corner?|A stamp.|Object",
  "I have branches, yet I have no leaves, no trunk, and no fruit. What am I?|A bank.|Concept",
  "The more you have of it, the less you see. What is it?|Darkness.|Phenomenon",
  "I’m not alive, but I grow; I don’t have lungs, but I need air; I don’t have a mouth, but water kills me. What am I?|Fire.|Element",
  "What gets wetter as it dries?|A towel.|Object",
  "I can be cracked, made, told, and played. What am I?|A joke.|Concept",
  "I fly without wings and cry without eyes. Whenever I go, darkness flies. What am I?|A cloud.|Phenomenon",
  "I can be broken without being held or touched. What am I?|A promise.|Concept",
  "The more you take out of it, the bigger it becomes. What is it?|A hole.|Object",
  "I am not alive, but I can grow; I don’t have lungs, but I need air; I don’t have a mouth, but water kills me. What am I?|Fire.|Element",
  "I can be cracked, played, and told. What am I?|A joke.|Concept",
  "I have keys but open no locks. I have space but no room. You can enter, but you can’t go outside. What am I?|A keyboard.|Object",
  "I’m light as a feather, yet the strongest man can’t hold me for much longer than a minute. What am I?|Breath.|Phenomenon",
  "The more you take, the more you leave behind. What am I?|Footsteps.|Concept",
  "What has one eye but cannot see?|A needle.|Object",
  "What has a head, a tail, is brown, and has no legs?|A penny.|Object",
  "What is full of holes but still holds water?|A sponge.|Object",
  "What can be broken without being touched?|Silence.|Concept",
  "What is always in front of you but can’t be seen?|The future.|Concept",
  "What gets sharper the more you use it?|Your brain.|Concept",
  "What belongs to you, but others use it more than you do?|Your name.|Concept",
  "What five-letter word becomes shorter when you add two letters to it?|Short.|Wordplay",
  "What has a thumb and four fingers but is not alive?|A glove.|Object",
  "What begins with T, ends with T, and has T in it?|A teapot.|Object",
  "The more you take, the more you leave behind. What am I?|Footsteps.|Concept",
  "I run, yet I have no legs. What am I?|A river.|Nature",
  "What goes up but never comes down?|Your age.|Concept",
  "I am seen in the water, but I never get wet. What am I?|A reflection.|Phenomenon",
  "What word is spelled incorrectly in every dictionary?|Incorrectly.|Wordplay",
  "I’m always on the dinner table, but you don’t get to eat me. What am I?|A plate.|Object",
  "What kind of room has no doors or windows?|A mushroom.|Object",
  "What has many teeth but cannot bite?|A comb.|Object",
  "What has legs but doesn’t walk?|A table.|Object",
  "The more you take, the more you leave behind. What am I?|Footsteps.|Concept",
  "What has hands but can’t clap?|A clock.|Object",
  "I have a heart that doesn’t beat. What am I?|An artichoke.|Nature",
  "What has a neck but no head?|A bottle.|Object",
  "I can only be given but never taken. What am I?|A compliment.|Concept",
  "The more you take, the more you leave behind. What am I?|Footsteps.|Concept",
  "What has to be broken before you can use it?|An egg.|Object",
  "I can be cracked, made, told, and played. What am I?|A joke.|Concept",
  "I have no life, but I can die. What am I?|A battery.|Object",
  "What is so fragile that saying its name breaks it?|Silence.|Concept",
  "What kind of tree can you carry in your hand?|A palm.|Nature",
  "The more you weigh, the lighter I get. What am I?|A balloon.|Object",
  "I start out tall, but the longer I stand, the shorter I grow. What am I?|A candle.|Object",
] as string[];

export const TRANSFORM_RULES = ["paraphrase"] as string[];

export const VARIANTS = ["baseline", "exploratory", "full"] as string[];

export type Variant = (typeof VARIANTS)[number];

export const MODEL = google("gemini-2.0-flash-lite");
