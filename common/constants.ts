export const Constants = {
    INDEX_NOT_FOUND: -1,
    RANDOM_STRING_LENGTH: 6,
    QUIZZES_PATH: '../../../../../assets/quizzes.json',
    MIN_DURATION: 10,
    MAX_DURATION: 60,
    MAX_POINTS: 100,
    MIN_POINTS: 10,
    MAX_CHOICES: 4,
    MIN_CHOICES: 2,
    MAX_TEXTAREA_LENGTH: 200,
    ONE_SECOND_INTERVAL: 1000,
    ROOM_CODE_LENGTH: 4,
    BONUS_20_PERCENT: 0.2,
    BONUS_120_PERCENT: 1.2,
    QUARTER_SECOND_INTERVAL: 250,
    MIN_TIME_TO_PANIC_QCM: 10,
    MIN_TIME_TO_PANIC_QRL: 20,
    AUDIO: './assets/audio/panic-mode.mp3',
    TIME_LENGTH: 8,
    SWITCH_COLOR_TIME_GAME: 3,
    SWITCH_COLOR_TIME_TEST_GAME: 4,
  } as const;

  
export const enum QTypes {
    QRL = 'QRL',
    QCM = 'QCM',
}