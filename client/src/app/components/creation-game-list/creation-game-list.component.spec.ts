import { ComponentFixture, TestBed } from '@angular/core/testing';
import { CreationGameListComponent } from './creation-game-list.component';

describe('CreationGameListComponent', () => {
    let component: CreationGameListComponent;
    let fixture: ComponentFixture<CreationGameListComponent>;

    beforeEach(() => {
        TestBed.configureTestingModule({
            declarations: [CreationGameListComponent],
        });
        fixture = TestBed.createComponent(CreationGameListComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });

    it('should toggle game details', () => {
        component.toggleDetails(0);
        expect(component.selectedGameId).toBe(0);

        component.toggleDetails(1);
        expect(component.selectedGameId).toBe(1);

        component.toggleDetails(1);
        expect(component.selectedGameId).toBe(null);
    });

    it('should only show visible games', () => {
        const visibleGame = {
            id: '1',
            name: 'visible',
            dateCreated: '11-11-11',
            visible: true,
            description: 'description jeu1',
            time: '11:11',
            questions: [],
        };
        const notVisibleGame = {
            id: '2',
            name: 'invisible',
            dateCreated: '11-11-11',
            visible: false,
            description: 'description jeu1',
            time: '11:11',
            questions: [],
        };

        component.games = [visibleGame, notVisibleGame];
        const visibleGames = component.getVisibleGames();

        expect(visibleGames.length).toEqual(1);
        expect(visibleGames[0]).toEqual(visibleGame);
    });

    it('should get questions', () => {
        const gameWithQuestions = {
            name: 'test',
            dateCreated: '11-11-11',
            visible: true,
            description: 'description jeu1',
            time: '11:11',
            questions: [
                {
                    type: 'QCM',
                    text: 'Question 1',
                    choices: [
                        { text: 'Choice 1', isCorrect: false },
                        { text: 'Choice 2', isCorrect: true },
                    ],
                },
                {
                    type: 'QCM',
                    text: 'Question 2',
                    choices: [
                        { text: 'Choice 1', isCorrect: true },
                        { text: 'Choice 2', isCorrect: false },
                    ],
                },
            ],
        };

        const gameWithoutQuestions = {
            name: 'test',
            dateCreated: '11-11-11',
            visible: true,
            description: 'description jeu1',
            time: '11:11',
            questions: [],
        };

        const noQuestions = component.getQuestionsArray(gameWithoutQuestions);
        const hasQuestions = component.getQuestionsArray(gameWithQuestions);

        expect(noQuestions).toEqual([]);
        expect(hasQuestions.length).toEqual(2);
        expect(hasQuestions[0].text).toBe('Question 1');
        expect(hasQuestions[1].text).toBe('Question 2');
    });

    it('should redirect to testing page', () => {
        // à compléter
    });

    it('should redirect to play page', () => {
        // à compléter
    });
});
