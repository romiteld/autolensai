{
  "title": "AutoLensAI Video Generation Pipeline",
  "overview": "30-second AI-generated marketing videos for vehicle listings",
  "total_time": "6-8 minutes",
  "steps": [
    {
      "step": 1,
      "name": "User Input",
      "description": "User provides video concept and selects images",
      "duration": "1-2 minutes",
      "inputs": [
        "Video marketing idea (text description)",
        "3 vehicle images from listing",
        "Video style preferences"
      ],
      "outputs": [
        "Validated video concept",
        "Selected image array",
        "Processing parameters"
      ]
    },
    {
      "step": 2,
      "name": "OpenAI Scene Generation",
      "description": "AI generates 3 detailed scene descriptions",
      "duration": "10-15 seconds",
      "inputs": [
        "User video idea",
        "Vehicle information context",
        "Marketing objectives"
      ],
      "outputs": [
        "Scene 1 description (0-10 seconds)",
        "Scene 2 description (10-20 seconds)",
        "Scene 3 description (20-30 seconds)"
      ],
      "api": "OpenAI GPT-4",
      "prompt_template": "Create 3 engaging video scenes for a {vehicle_make} {vehicle_model}"
    },
    {
      "step": 3,
      "name": "FalAI Video Generation",
      "description": "Generate video clips from images and prompts",
      "duration": "6-9 minutes (parallel processing)",
      "inputs": [
        "Vehicle image 1 + Scene 1 prompt",
        "Vehicle image 2 + Scene 2 prompt",
        "Vehicle image 3 + Scene 3 prompt"
      ],
      "outputs": [
        "10-second video clip 1",
        "10-second video clip 2",
        "10-second video clip 3"
      ],
      "api": "FalAI Kling 2.1",
      "processing": "Parallel generation for faster completion"
    },
    {
      "step": 4,
      "name": "Sonauto Music Generation",
      "description": "Generate fitting background music",
      "duration": "30-45 seconds",
      "inputs": [
        "Video theme/mood",
        "Scene descriptions",
        "Target duration (30 seconds)"
      ],
      "outputs": [
        "Background music track",
        "Audio file (MP3/WAV)",
        "Synchronized timing"
      ],
      "api": "Sonauto AI",
      "style": "Automotive commercial style"
    },
    {
      "step": 5,
      "name": "FFmpeg Video Compilation",
      "description": "Merge clips and add audio",
      "duration": "15-30 seconds",
      "inputs": [
        "3 video clips (10s each)",
        "Background music track",
        "Transition effects"
      ],
      "outputs": [
        "Final 30-second video",
        "MP4 format optimized for YouTube Shorts",
        "1080x1920 resolution (vertical)"
      ],
      "processing": [
        "Concatenate video clips",
        "Add background music",
        "Apply transitions",
        "Optimize for mobile viewing"
      ]
    },
    {
      "step": 6,
      "name": "YouTube Shorts Upload",
      "description": "Automated upload with optimization",
      "duration": "30-60 seconds",
      "inputs": [
        "Final video file",
        "Vehicle listing data",
        "Call-to-action information"
      ],
      "outputs": [
        "YouTube Shorts URL",
        "Video analytics setup",
        "Backlink to vehicle listing"
      ],
      "api": "YouTube Data API v3",
      "metadata": {
        "title": "Check out this amazing vehicle!",
        "description": "See more details and schedule a test drive",
        "tags": [
          "car",
          "forsale",
          "automotive"
        ],
        "shorts_optimization": true
      }
    }
  ],
  "technical_requirements": {
    "apis": [
      "OpenAI GPT-4",
      "FalAI Kling 2.1",
      "Sonauto",
      "YouTube Data API v3"
    ],
    "processing": "FFmpeg server-side",
    "storage": "Supabase Storage for video files",
    "queue": "Background job processing for video generation",
    "monitoring": "Real-time progress tracking for users"
  },
  "user_experience": {
    "progress_tracking": "Real-time status updates",
    "notifications": "Email/SMS when video is ready",
    "preview": "Video preview before YouTube upload",
    "editing": "Option to regenerate specific scenes",
    "sharing": "Direct link sharing and social media integration"
  }
}