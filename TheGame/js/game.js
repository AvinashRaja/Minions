
var isPause = false;
var gameOver = true;

var Q = Quintus()
    .include("Sprites, Scenes, Input, 2D, Anim, Touch, UI")
    .setup("gameCanvas") //{ width: 950, height: 540 })
    .controls().touch();

window.Q = Q;
Q.scene("gameStats", function (stage) {
    var statsContainer = stage.insert(new Q.UI.Container({
        fill: "gray", x: 670 / 2, y: 40, border: 1, shadow: 3, shadowColor: "rgba(0,0,0,0.5)", w: 960, h: 40, opacity: 0.2,
    }));

    var lives = stage.insert(new Q.UI.Text({
        label: "Life : 100%", color: "white", x: -200, y: 0
    }), statsContainer);

    var coins = stage.insert(new Q.UI.Text({
        label: "Coins : 0", color: "white", x: 200, y: 0
    }), statsContainer);
});
Q.scene("stageStats", function (stage) {
    var statsContainer = stage.insert(new Q.UI.Container({
        fill: "gray", x: 580, y: 115, border: 1, shadow: 2, shadowColor: "rgba(0,0,0,0.5)", w: 140, h: 80, opacity: 0.2,
    }));

    stage.insert(new Q.UI.Button({ sheet: "loan", x: -15, scale: 1.2, y: -15, opacity: 0.7 }, function () { }), statsContainer);
    var loanTxt = stage.insert(new Q.UI.Text({ label: ": -", size: 18, color: "white", x: 42, y: -16, }), statsContainer);

    stage.insert(new Q.UI.Button({ sheet: "bond", x: -16, scale: 1.2, y: 15, opacity: 0.7 }, function () { }), statsContainer);
    var bondTxt = stage.insert(new Q.UI.Text({ label: ": -", size: 18, color: "white", x: 42, y: 14, }), statsContainer);
});

var displayEnd = function (isGameOver) {
    if (isGameOver == 1)
        Q.stageScene("endGame", 3, { label: "Game Over" });
    else
        Q.stageScene("endGame", 3, { label: "Portfolio created, next collect Market data and Static data" });
    gameOver = true;
};
Q.scene("endGame", function (stage) {
    var container = stage.insert(new Q.UI.Container({
        x: Q.width / 2, y: Q.height / 2, fill: "rgba(0,0,0,0.5)",
    }));
    var button = container.insert(new Q.UI.Button({
        x: 0, y: 0, fill: "#CCCCCC", label: "stay tuned :)",
    },
        function () { console.log('yet to impliment') }));
    var label = container.insert(new Q.UI.Text({
        x: 0, y: -10 - button.p.h, fill: "#CCCCCC", label: stage.options.label,
    }));
    container.fit(20);
});

var SPRITE_BOX = 1;
Q.gravityY = 2000;

Q.Sprite.extend("Player", {
    init: function (p) {
        this._super(p, {
            sheet: "player",        // Spritesheet
            sprite: "player",       // Animationsheet
            x: 40,
            y: 400,
            jump: -850,
            speed: 500,
            scale: 0.4,             // scale sprite to right size
            flip: "",
            collisionMask: SPRITE_BOX,
            coins: 0,
            life: 100,
            loan: 0,
            bond: 0,
        });

        //this.p.points = [[0, 0], [20, 0], [20, 20], [0, 20]]; //Giving player points of collision
        this.add("2d, animation");  // Add components
    },
    step: function (dt) {
        if (gameOver) return;
        this.p.vx += (this.p.speed - this.p.vx) / 4;

        if (this.p.y > 505) {
            this.p.y = 505;
            this.p.landed = 1;
            this.p.vy = 0;
        } else {
            this.p.landed = 0;
        }

        if (Q.inputs['up'] && this.p.landed > 0) {
            this.p.vy = this.p.jump;
        }
        else if (Q.inputs['down'] && this.p.landed == 0) {
            this.p.vy = -this.p.jump;
        }

        if (this.p.landed) {
            this.play("walk_right");
        } else {
            this.play("jump");
        }

        if (this.p.timeInvincible > 0) {
            this.p.timeInvincible = Math.max(this.p.timeInvincible - dt, 0);
        } else {
            this.p.opacity = 1;
        }

        this.stage.viewport.centerOn(this.p.x + 250, 400);
    },
    addCoin: function () {
        this.p.coins++;
        var coinsLabel = Q("UI.Text", 1).items[1];
        coinsLabel.p.label = "Coins : " + this.p.coins;
    },
    damage: function () {
        if (!this.p.timeInvincible) {
            this.p.opacity = 0.5;
            this.p.life -= 25;
            this.p.timeInvincible = 1;
            var lifeLabel = Q("UI.Text", 1).first();
            lifeLabel.p.label = "Life : " + this.p.life + "%";
            if (this.p.life < 5)
                displayEnd(1);
        }
    },
});

Q.Sprite.extend("Coin", {
    init: function () {
        var levels = [535, 470, 410, 350, 300];// [585, 520, 460, 400, 350];

        var player = Q("Player").first();
        this._super({
            x: player.p.x + Q.width + 50,
            y: levels[Math.floor(Math.random() * 5)],
            frame: 0,
            scale: 1.5,
            type: SPRITE_BOX,
            sheet: "coin",        // Spritesheet
            sprite: "coin",       // Animationsheet
            vx: -100 + 200 * Math.random(),
            vy: 0,
            ay: 0,
            theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1),
            hasHit: false,
        });
        this.add("animation");
        this.on("hit");
    },
    step: function (dt) {
        //this.play("rotate");
        this.p.x += this.p.vx * dt;

        this.p.vy += this.p.ay * dt;
        this.p.y += this.p.vy * dt;
        if (this.p.y != 535) {
            this.p.angle += this.p.theta * dt;
        }

        if (this.p.y > 800) { this.destroy(); }
    },
    hit: function (collision) {
        this.p.type = 0;
        this.p.collisionMask = Q.SPRITE_NONE;
        this.p.vx = 200;
        this.p.ay = 400;
        this.p.vy = -300;
        this.p.opacity = 0.5;

        if (!this.p.hasHit)
            collision.obj.addCoin();
        this.p.hasHit = true;
        this.destroy();
    }
});

Q.Sprite.extend("Loan", {
    init: function () {
        var levels = [535, 470, 410, 350];

        var player = Q("Player").first();
        this._super({
            x: player.p.x + Q.width + 50,
            y: levels[Math.floor(Math.random() * 4)],
            frame: 0,
            scale: 1.2,
            type: SPRITE_BOX,
            sheet: "loan",        // Spritesheet
            vx: -100 + 200 * Math.random(),
            vy: 0,
            ay: 0,
            theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1),
            hasHit: false,
        });
        this.add("animation");
        this.on("hit");
    },
    step: function (dt) {
        this.p.x += this.p.vx * dt;

        this.p.vy += this.p.ay * dt;
        this.p.y += this.p.vy * dt;
        if (this.p.y != 535 && this.p.y != 410) {
            this.p.angle += this.p.theta * dt;
        }

        if (this.p.y > 800) { this.destroy(); }
    },
    hit: function (collision) {
        this.p.type = 0;
        this.p.collisionMask = Q.SPRITE_NONE;
        this.p.vx = 200;
        this.p.ay = 400;
        this.p.vy = -300;
        this.p.opacity = 0.5;
        if (!this.p.hasHit) {
            collision.obj.p.loan++;
            var lifeLabel = Q("UI.Text", 2).first();
            lifeLabel.p.label = " : " + collision.obj.p.loan;
            if (collision.obj.p.loan + collision.obj.p.bond >= 20)
                displayEnd(0);
        }
        this.p.hasHit = true;
        this.destroy();
    }
});

Q.Sprite.extend("Bond", {
    init: function () {
        var levels = [535, 470, 410, 350];

        var player = Q("Player").first();
        this._super({
            x: player.p.x + Q.width + 50,
            y: levels[Math.floor(Math.random() * 4)],
            frame: 0,
            scale: 1.2,
            type: SPRITE_BOX,
            sheet: "bond",        // Spritesheet
            vx: -100 + 200 * Math.random(),
            vy: 0,
            ay: 0,
            theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1),
            hasHit: false,
        });
        this.add("animation");
        this.on("hit");
    },
    step: function (dt) {
        this.p.x += this.p.vx * dt;

        this.p.vy += this.p.ay * dt;
        this.p.y += this.p.vy * dt;
        if (this.p.y != 535 && this.p.y != 410) {
            this.p.angle += this.p.theta * dt;
        }

        if (this.p.y > 800) { this.destroy(); }
    },
    hit: function (collision) {
        this.p.type = 0;
        this.p.collisionMask = Q.SPRITE_NONE;
        this.p.vx = 200;
        this.p.ay = 400;
        this.p.vy = -300;
        this.p.opacity = 0.5;
        if (!this.p.hasHit) {
            collision.obj.p.bond++;
            var lifeLabel = Q("UI.Text", 2).items[1];
            lifeLabel.p.label = " : " + collision.obj.p.bond;
            if (collision.obj.p.loan + collision.obj.p.bond > 20)
                displayEnd(0);
        }
        this.p.hasHit = true;
        this.destroy();
    }
});

Q.Sprite.extend("Stock", {
    init: function () {
        var levels = [535, 470, 410, 350];
        var player = Q("Player").first();
        this._super({
            x: player.p.x + Q.width + 50,
            y: levels[Math.floor(Math.random() * 4)],
            //frame: 1,//Math.random() < 0.5 ? 1 : 0,
            scale: 1.2,
            type: SPRITE_BOX,
            sheet: "stock",        // Spritesheet
            vx: -100 + 200 * Math.random(),
            vy: 0,
            ay: 0,
            theta: (300 * Math.random() + 200) * (Math.random() < 0.5 ? 1 : -1),
            hasHit: false,
        });
        this.add("animation");
        this.on("hit");
    },
    step: function (dt) {
        this.p.x += this.p.vx * dt;

        this.p.vy += this.p.ay * dt;
        this.p.y += this.p.vy * dt;
        if (this.p.y != 535 && this.p.y != 410) {
            this.p.angle += this.p.theta * dt;
        }

        if (this.p.y > 800) { this.destroy(); }
    },
    hit: function (collision) {
        this.p.type = 0;
        this.p.collisionMask = Q.SPRITE_NONE;
        this.p.vx = 200;
        this.p.ay = 400;
        this.p.vy = -300;
        this.p.opacity = 0.5;
        if (collision.obj.isA("Player"))
            collision.obj.damage();
    }
});

Q.GameObject.extend("Thrower", {
    init: function () {
        this.p = {
            launchDelay: 0.75,
            launchRandom: 1,
            launch: 2
        }
    },
    update: function (dt) {
        this.p.launch -= dt;
        var ran = [Q.Coin, Q.Bond, Q.Loan, Q.Stock];
        if (this.p.launch < 0) {
            this.stage.insert(new ran[Math.floor(Math.random() * 4)]());
            this.p.launch = this.p.launchDelay + this.p.launchRandom * Math.random();
        }
    },
    render: function () { }
});

Q.scene("gameScene", function (stage) {
    stage.insert(new Q.Repeater({ asset: "background-sky.png", speedX: 0.04 }));
    stage.insert(new Q.Repeater({ asset: "background-mount.png", repeatY: false, speedX: 0.2, y: 170 }));
    stage.insert(new Q.Repeater({ asset: "background-floor.png", repeatY: false, speedX: 0.4, y: 275, type: SPRITE_BOX }));

    stage.insert(new Q.Thrower());

    stage.insert(new Q.Player());
    stage.add("viewport");
});

Q.load("player.png, background-sky.png, background-mount.png, background-floor.png, coins.png, loan.png, bond.png, stock.png", function () {
    Q.sheet("player", "player.png", { "tilew": 130, "tileh": 230, "sx": 0, "sy": 0 });
    Q.sheet("coin", "coins.png", { "tilew": 32, "tileh": 36 });
    Q.sheet("loan", "loan.png", { "tilew": 71, "tileh": 28 });
    Q.sheet("bond", "bond.png", { "tilew": 71, "tileh": 28 });
    Q.sheet("stock", "stock.png", { "tilew": 80, "tileh": 24 });
    Q.animations("player", {
        walk_left: { frames: [0, 1, 2, 3], next: 'stand_left', rate: 1 / 5 },
        walk_right: { frames: [0, 1, 2, 3], next: 'stand_right', rate: 1 / 5 },
        stand_left: { frames: [0] },
        stand_right: { frames: [0] },
        jump: { frames: [2], loop: false, rate: 1 },
    });
    Q.animations("coin", {
        rotate: { frames: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], rate: 1 / 5 },
    });

    Q.stageScene("dummy");
});

Q.scene("dummy", function (stage) {
    stage.insert(new Q.Repeater({ asset: "background-sky.png", speedX: 0.04 }));
    stage.insert(new Q.Repeater({ asset: "background-mount.png", repeatY: false, speedX: 0.2, y: 170 }));
    stage.insert(new Q.Repeater({ asset: "background-floor.png", repeatY: false, speedX: 0.4, y: 275, type: SPRITE_BOX }));

    stage.add("viewport");
});