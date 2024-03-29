export enum GameEvents {
    StartGame = 'startGame',
    PlayerLeaveGame = 'playerLeaveGame',
    EndGame = 'endGame',
    GoodAnswer = 'goodAnswer',
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
    RemoveAnswerTime = 'removeAnswerTime',
    SaveChartData = 'saveChartData',
    FieldInteraction = 'FieldInteraction',
    AllPlayersSubmitted = 'allPlayersSubmitted',
    QRLAnswerUpdate = 'qrlAnswerUpdate',
}
