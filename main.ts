// Simple Friday Night Funkin' Style Rhythm Game for MakeCode Arcade

enum Direction {
    Up,
    Down,
    Left,
    Right
}

// Utility to get arrow images
function getArrowImage(direction: Direction): Image {
    switch (direction) {
        case Direction.Up:
            return img`
                . . 2 2 2 . . 
                . 2 4 4 4 2 . 
                2 4 5 5 5 4 2 
                2 4 5 5 5 4 2 
                2 4 5 5 5 4 2 
                . 2 4 4 4 2 . 
                . . 2 2 2 . . 
            `;
        case Direction.Down:
            return img`
                . . 3 3 3 . . 
                . 3 6 6 6 3 . 
                3 6 7 7 7 6 3 
                3 6 7 7 7 6 3 
                3 6 7 7 7 6 3 
                . 3 6 6 6 3 . 
                . . 3 3 3 . . 
            `;
        case Direction.Left:
            return img`
                . . 4 4 4 . . 
                . 4 8 8 8 4 . 
                4 8 9 9 9 8 4 
                4 8 9 9 9 8 4 
                4 8 9 9 9 8 4 
                . 4 8 8 8 4 . 
                . . 4 4 4 . . 
            `;
        case Direction.Right:
            return img`
                . . 5 5 5 . . 
                . 5 a a a 5 . 
                5 a b b b a 5 
                5 a b b b a 5 
                5 a b b b a 5 
                . 5 a a a 5 . 
                . . 5 5 5 . . 
            `;
    }
    return img``;
}

function getXPosition(direction: Direction): number {
    return 40 + direction * 30;
}

// Rename Note to GameNote to avoid duplication issues
type GameNote = {
    sprite: Sprite;
    direction: Direction;
};

// Create a note sprite
function createNote(direction: Direction, yOffset: number): GameNote {
    let s = sprites.create(getArrowImage(direction), SpriteKind.Enemy);
    s.x = getXPosition(direction);
    s.y = -yOffset;
    s.vy = 50;
    return { sprite: s, direction: direction };
}

// Game variables
let score = 0;
let combo = 0;
let health = 100;
let level = 0;
let songBeats: Direction[] = [];
let beatIndex = 0;
let activeNotes: GameNote[] = [];
let player: Sprite = null;
let opponent: Sprite = null;
let feedbackSprite: Sprite = null;
let chartInterval = 500;
let perfectWindow = 8;
let goodWindow = 16;

// Show title screen
function showTitleScreen() {
    scene.setBackgroundColor(9);
    game.splash("🎶 FNF: MakeCode Remix 🎶", "Press A to Play");
    controller.A.onEvent(ControllerButtonEvent.Pressed, startGame);
}

// Start story and set sprites
function startStory(level: number) {
    scene.setBackgroundColor(1);
    player = sprites.create(img`
        . . f f f f . . 
        . f f f f f f . 
        f f f f f f f f 
        f f f f f f f f 
        f f f f f f f f 
        . f f f f f f . 
        . . f f f f . . 
    `, SpriteKind.Player);
    player.setPosition(30, 100);
    opponent = sprites.create(img`
        . . c c c c . . 
        . c c c c c c . 
        c c c c c c c c 
        c c c c c c c c 
        c c c c c c c c 
        . c c c c c c . 
        . . c c c c . . 
    `, SpriteKind.Player);
    opponent.setPosition(130, 100);
    let label = sprites.create(image.create(80, 16), SpriteKind.Food);
    label.setPosition(80, 20);
    label.say("WEEK " + (level + 1));
    pause(1500);
    label.destroy();
}

// Load song beats and music
function loadSong(level: number) {
    if (songBeats.length > 0) return;
    if (level === 0) {
        songBeats = [Direction.Left, Direction.Up, Direction.Right, Direction.Down, Direction.Up, Direction.Down, Direction.Left, Direction.Right];
        music.play(music.stringPlayable("C C G G A A G -", 120), music.PlaybackMode.LoopingInBackground);
    } else {
        songBeats = [Direction.Left, Direction.Right, Direction.Down, Direction.Up, Direction.Up, Direction.Left, Direction.Right, Direction.Down];
        music.play(music.stringPlayable("E E G G A A G G", 120), music.PlaybackMode.LoopingInBackground);
    }
}

// Start game
function startGame() {
    score = 0;
    combo = 0;
    health = 100;
    beatIndex = 0;
    songBeats = [];
    activeNotes = [];
    startStory(level);
    loadSong(level);
    info.setScore(0);
    info.setLife(10);
}

// Spawn notes over time
game.onUpdateInterval(chartInterval, function () {
    if (beatIndex < songBeats.length) {
        activeNotes.push(createNote(songBeats[beatIndex], 0));
        beatIndex++;
    } else if (beatIndex === songBeats.length) {
        endLevel();
        beatIndex++;
    }
});

// End level
function endLevel() {
    music.stopAllSounds();
    let msg = health > 0 ? "🎉 Victory!" : "💀 Try Again!";
    game.splash(msg);
    if (health > 0) {
        level++;
        songBeats = [];
        startGame();
    } else {
        game.over(false);
    }
}

// Player tries to hit a note
function tryHit(dir: Direction) {
    for (let i = 0; i < activeNotes.length; i++) {
        let n = activeNotes[i];
        let dist = Math.abs(n.sprite.y - 100);
        if (n.direction === dir && dist < goodWindow) {
            n.sprite.destroy();
            activeNotes.removeAt(i);
            showFeedback(dist < perfectWindow ? "Perfect!" : "Good!");
            combo++;
            score += dist < perfectWindow ? 150 : 100;
            health = Math.min(100, health + 5);
            player.say("🎤", 300);
            opponent.say("😮", 300);
            return;
        }
    }
    showFeedback("Miss!");
    health -= 10;
    score -= 50;
    combo = 0;
    player.say("😢", 300);
    if (health <= 0) game.over(false);
}

// Show feedback text above
function showFeedback(text: string) {
    if (feedbackSprite) feedbackSprite.destroy();
    feedbackSprite = sprites.create(image.create(80, 16), SpriteKind.Food);
    feedbackSprite.setPosition(80, 20);
    feedbackSprite.say(text);
    pause(300);
    feedbackSprite.destroy();
}

// Controls
controller.up.onEvent(ControllerButtonEvent.Pressed, () => tryHit(Direction.Up));
controller.down.onEvent(ControllerButtonEvent.Pressed, () => tryHit(Direction.Down));
controller.left.onEvent(ControllerButtonEvent.Pressed, () => tryHit(Direction.Left));
controller.right.onEvent(ControllerButtonEvent.Pressed, () => tryHit(Direction.Right));

// Remove notes that fall off screen
game.onUpdate(function () {
    for (let note of activeNotes) {
        if (note.sprite.y > 120) {
            note.sprite.destroy();
            combo = 0;
            score -= 25;
            health -= 5;
        }
    }
    activeNotes = activeNotes.filter(n => n.sprite.y < 130);
    info.setScore(score);
    info.setLife(Math.idiv(health, 10));
});

// Start the game
showTitleScreen();
