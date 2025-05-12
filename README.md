# COMP6590 Practical Project 'CompuRiddle'

## Overview

CompuRiddle is a project designed for the COMP6590 practical project. It
leverages AI and machine learning models, specifically Google's
Gemini-2.0-flash-lite and TensorFlow, to generate and refine riddles. The
project is built using TypeScript and includes modules that handle riddle
generation and creativity processes.

## Requirements

- **Node.js** v22 or higher (Node 22 is required for macOS due to TensorFlow
  limitations, lower versions on other systems may work)
- **npm** v9 or higher
- **TypeScript** (installed via `peerDependencies`)

### Additional Dependencies

- **@ai-sdk/google**: For integrating Google's Gemini-2.0-flash-lite model
- **@tensorflow-models/universal-sentence-encoder**: TensorFlow model for
  universal sentence encoding
- **@tensorflow/tfjs**: TensorFlow.js for handling tensor operations
- **ai**: AI module for creativity processing
- **zod**: Schema validation for structured data

### Development Dependencies

- **tsx**: TypeScript execution in development
- **yargs**: Command-line argument parsing

## Installation

Follow these steps to set up the project locally:

1. **Download / Clone the repository**
2. **Install dependencies:**

```bash
npm install
```

3. **Set up environment variables:**

You must set your Google Generative AI API key as an environment variable:

```bash
export GOOGLE_GENERATIVE_AI_API_KEY='your-api-key-here'
```

4. **Run the project:**

```
npm run start
```

Additionally, you can parse the `--help` flag to the start command
(`npm run start -- --help`) to get additional options.
