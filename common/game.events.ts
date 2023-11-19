export enum GameEvents {
    StartGame = 'startGame',
    PlayerLeaveGame = 'playerLeaveGame',
    EndGame = 'endGame',
    GoodAnswer = 'goodAnswer',
    GoodAnswerOnClick = 'goodAnswerOnClick',
    GoodAnswerOnFinishedTimer = 'goodAnswerOnFinishedTimer',
    BadAnswer = 'badAnswer',
    BadAnswerOnClick = 'badAnswerOnClick',
    BadAnswerOnFinishedTimer = 'badAnswerOnFinishedTimer',
    ToggleSelect = 'toggleSelect',
    QuestionChoiceSelect = 'questionChoiceSelect',
    QuestionChoiceUnselect = 'questionChoiceUnselect',
    QuestionChoicesUnselect = 'questionChoicesUnselect',
    GiveBonus = 'giveBonus',
    AddPointsToPlayer = 'addPointsToPlayer',
    NextQuestion = 'nextQuestion',
    PlayerAbandonedGame = 'abandonedGame',
    GameAborted = 'gameAborted',
    ShowResults = 'showResults',
    BonusUpdate = 'bonusUpdate',
    SendResults = 'sendResults',
    SubmitAnswer = 'submitAnswer',
    UnSubmitAnswer = 'unSubmitAnswer',
    SubmitQuestionOnClick = 'submitQuestionOnClick',
    RemoveAnswerTime = 'removeAnswerTime',
    GetQuestionChartData = 'getQuestionChartData',
    SaveChartData = 'saveChartData',
}
