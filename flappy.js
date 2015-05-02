(function() {

    'use strict'

    var
    //basic building blocks for any html5 2d game//
    //canvas properties//
        canvas,
        ctx,
        width,
        height,
        pressEvent,
        foregroundPosition,
        //sprite management
        frames,

        //scores
        score,
        best,

        //Game state management
        currentstate,
        states = {},
        okbtn,

        //main objects
        //hero object
        hero = {
            //hero properties
            x: 60,
            y: 0,
            frame: 0, //current hero frame
            animation: [0, 1, 2, 3, 2, 5], //animation sequence
            rotation: 0,
            gravity: 0.25,
            _jump: 4.6,
            velocity: 0,
            radius: 12,

            jump: function() {
                this.frame = 0;
                this.velocity = -this._jump;
            },
            //constantly firing
            update: function() {
                var n = currentstate === states.Splash ? 10 : 8;
                this.frame += frames % n === 0 ? 1 : 0;
                this.frame %= this.animation.length - 1;

                if (currentstate === states.Splash) {
                    //Splash State
                    this.y = height - 280 + 25 * Math.cos(frames / 10);
                    this.rotation = 0;
                } else {
                    //Game State
                    this.velocity += this.gravity;
                    this.y += this.velocity;

                    //if hero hits the pipe
                    if (this.y >= height - s_fg.height - 10) {
                        this.y = height - s_fg.height - 10;
                        if (currentstate === states.Game) {
                            currentstate = states.Score;
                        }
                        this.velocity = this._jump;
                    }

                    //height restriction
                    if (this.y < 0) {
                        this.y = 0;
                    }

                    if (this.velocity >= this._jump) {
                        //going down
                        this.frame = 5;
                        this.rotation = Math.min(Math.PI / 2, this.rotation + 0.003);
                    } else {
                        //going up
                        this.rotation = -0.1
                    }
                }
            },
            draw: function(ctx) {
                ctx.save();
                ctx.translate(this.x, this.y);
                ctx.rotate(this.rotation);

                var n = this.animation[this.frame];
                s_hero[n].draw(ctx, -s_hero[n].width / 2, -s_hero[n].height / 2);

                /*ctx.fillStyle = "#000"
            ctx.beginPath();
            ctx.arc(0, 0, this.radius, 0, 2*Math.PI);
            ctx.fill();*/

                ctx.restore();
            }
        },
        pipes = {
            _pipes: [],

            reset: function() {
                this._pipes = [];
            },
            update: function() {
                if (frames % 100 === 0) {
                    var _y = height - (s_pipeSouth.height + s_fg.height + 100 + 200 * Math.random());
                    this._pipes.push({
                        x: 500,
                        y: _y,
                        width: s_pipeSouth.width,
                        height: s_pipeSouth.height
                    });
                }

                for (var i = 0, len = this._pipes.length; i < len; i++) {
                    var currentPipe = this._pipes[i];
                    //collision detection
                    if (i === 0) {

                        score += currentPipe.x === hero.x ? 1 : 0;

                        var closestX = Math.min(Math.max(hero.x, currentPipe.x), currentPipe.x + currentPipe.width);
                        var closestY = Math.min(Math.max(hero.y, currentPipe.y), currentPipe.y + currentPipe.height);
                        var closestY2 = Math.min(Math.max(hero.y, currentPipe.y + currentPipe.height + 80), currentPipe.y + 2 * currentPipe.height + 80);

                        var dx = hero.x - closestX;
                        var dy1 = hero.y - closestY;
                        var dy2 = hero.y - closestY2;

                        var d1 = dx * dx + dy1 * dy1;
                        var d2 = dx * dx + dy2 * dy2;

                        var r = hero.radius * hero.radius;

                        if (r > d1 || r > d2) {
                            currentstate = states.Score;
                        }
                    }

                    currentPipe.x -= 2;
                    if (currentPipe.x < -50) {
                        this._pipes.splice(i, 1);
                        i--;
                        len--;
                    }
                }
            },
            draw: function(ctx) {
                for (var i = 0, len = this._pipes.length; i < len; i++) {
                    var currentPipe = this._pipes[i];
                    s_pipeSouth.draw(ctx, currentPipe.x, currentPipe.y);
                    s_pipeNorth.draw(ctx, currentPipe.x, currentPipe.y + 80 + currentPipe.height);
                }
            }
        };

    function init() {
        states = {
            Splash: 0,
            Game: 1,
            Score: 2
        };

        frames = score = best = foregroundPosition = 0;
    }

    function setup() {

        init();
        canvas = document.createElement("canvas");
        width = window.innerWidth;
        height = window.innerHeight;

        pressEvent = "touchstart";

        //if not mobile,  set the canvas width and height
        if (width >= 500) {
            width = 320;
            height = 480;
            canvas.style.border = "1px solid #000";
            pressEvent = "mousedown";
        }

        canvas.width = width;
        canvas.height = height;
        ctx = canvas.getContext("2d");

        currentstate = states.Splash;

        document.body.appendChild(canvas);

        var img = new Image();
        img.onload = function() {
            initSprites(this);
            //set background color
            ctx.fillStyle = s_bg.color;

            okbtn = {
                x: (width - s_buttons.Ok.width) / 2,
                y: height - 200,
                width: s_buttons.Ok.width,
                height: s_buttons.Ok.height
            };
            run();

        }

        img.src = "res/sheet.png";

        document.addEventListener(pressEvent, onpress);
    }

    function run() {
        var loop = function() {
            update();
            render();
            window.requestAnimationFrame(loop, canvas);
        }
        window.requestAnimationFrame(loop, canvas);
    }

    function update() {
        frames++;

        if (currentstate !== states.Score) {
            //update foreground position
            foregroundPosition = (foregroundPosition - 2) % 14;
        } else {
            best = Math.max(best, score);
        }

        if (currentstate == states.Game) {
            pipes.update();
        }

        hero.update();

    }

    function render() {
        ctx.fillRect(0, 0, width, height); // fill background color
        //background
        s_bg.draw(ctx, 0, height - s_bg.height);
        s_bg.draw(ctx, s_bg.width, height - s_bg.height); //second background offset to fill the canvas
        //foreground
        s_fg.draw(ctx, foregroundPosition, height - s_fg.height);
        s_fg.draw(ctx, foregroundPosition + s_fg.width, height - s_fg.height); //second foreground offset to fill the canvas
        //hero
        hero.draw(ctx);
        //pipes
        pipes.draw(ctx);
        //used to find center of canvas
        var width2 = width / 2;

        //state management
        //Splash Screen
        if (currentstate === states.Splash) {
            s_splash.draw(ctx, width2 - s_splash.width / 2, height - 300);
            s_text.GetReady.draw(ctx, width2 - s_text.GetReady.width / 2, height - 380);
        }
        //Score Screen
        if (currentstate === states.Score) {
            s_text.GameOver.draw(ctx, width2 - s_text.GameOver.width / 2, height - 400);
            s_score.draw(ctx, width2 - s_score.width / 2, height - 340);
            s_buttons.Ok.draw(ctx, okbtn.x, okbtn.y);

            s_numberS.draw(ctx, width2 - 47, height - 304, score, null, 10);
            s_numberS.draw(ctx, width2 - 47, height - 260, best, null, 10);
        } else {
            s_numberB.draw(ctx, null, 20, score, width2);
        }
    }

    //press handler: depends on the current state
    function onpress(evt) {
        switch (currentstate) {
            //if Splash Screen, go to Game state and start jumping
            case states.Splash:
                currentstate = states.Game;
                hero.jump();
                break;
                //if Game state, start jumping
            case states.Game:
                hero.jump();
                break;
                //if Score state
            case states.Score:
                var
                    mx = evt.offsetX || evt.layerX || evt.touches[0].clientX, //detect press or mouse press x/y coordinates for multiple browsers or mobile 
                    my = evt.offsetY || evt.layerY || evt.touches[0].clientY;

                //detect if you press the ok button
                if (okbtn.x < mx && mx < okbtn.x + okbtn.width &&
                    okbtn.y < my && my < okbtn.y + okbtn.height
                ) {
                    //reset pipes, go to Splash Screen
                    pipes.reset();
                    currentstate = states.Splash;
                    score = 0;
                }
                break;
        }
    }

    setup();

}());