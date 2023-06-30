var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Animations = (function () {
        function Animations() {
        }
        Animations.prototype.animatePlayerRemoveCrouch = function (thing) {
            thing.crouching = false;
            thing.toly = thing.tolyOld || 0;
            if (thing.power !== 1) {
                thing.FSM.setHeight(thing, 16, true, true);
                thing.FSM.removeClasses(thing, "crouching");
                thing.FSM.updateBottom(thing, 0);
                thing.FSM.updateSize(thing);
            }
            thing.FSM.animations.animatePlayerRunningCycle(thing);
        };
        Animations.prototype.animateSolidBump = function (thing) {
            var dx = -3;
            thing.FSM.TimeHandler.addEventInterval(function (thing) {
                thing.FSM.shiftVert(thing, dx);
                dx += .5;
                if (dx === 3.5) {
                    thing.up = undefined;
                    return true;
                }
                return false;
            }, 1, Infinity, thing);
        };
        Animations.prototype.animateBlockBecomesUsed = function (thing) {
            thing.used = true;
            thing.FSM.switchClass(thing, "unused", "used");
        };
        Animations.prototype.animateSolidContents = function (thing, other) {
            var output;
            if (other && other.player && other.power > 1 && thing.contents === "Mushroom") {
                thing.contents = "FireFlower";
            }
            output = thing.FSM.addThing(thing.contents || thing.constructor.prototype.contents);
            thing.FSM.setMidXObj(output, thing);
            thing.FSM.setTop(output, thing.top);
            output.blockparent = thing;
            output.animate(output, thing);
            return output;
        };
        Animations.prototype.animateBrickShards = function (thing) {
            var unitsize = thing.FSM.unitsize, shard, left, top, i;
            for (i = 0; i < 4; i += 1) {
                left = thing.left + Number(i < 2) * thing.width * unitsize - unitsize * 2;
                top = thing.top + (i % 2) * thing.height * unitsize - unitsize * 2;
                shard = thing.FSM.addThing("BrickShard", left, top);
                shard.xvel = shard.speed = unitsize / 2 - unitsize * Number(i > 1);
                shard.yvel = unitsize * -1.4 + i % 2;
                thing.FSM.TimeHandler.addEvent(thing.FSM.deaths.killNormal, 70, shard);
            }
        };
        Animations.prototype.animateEmerge = function (thing, other) {
            thing.nomove = thing.nocollide = thing.nofall = thing.alive = true;
            thing.FSM.flipHoriz(thing);
            thing.FSM.AudioPlayer.play("Powerup Appears");
            thing.FSM.arraySwitch(thing, thing.FSM.GroupHolder.getGroup("Character"), thing.FSM.GroupHolder.getGroup("Scenery"));
            thing.FSM.TimeHandler.addEventInterval(function () {
                thing.FSM.shiftVert(thing, thing.FSM.unitsize / -8);
                if (thing.bottom > other.top) {
                    return false;
                }
                thing.FSM.setBottom(thing, other.top);
                thing.FSM.GroupHolder.switchMemberGroup(thing, "Scenery", "Character");
                thing.nomove = thing.nocollide = thing.nofall = thing.moveleft = false;
                if (thing.emergeOut) {
                    thing.emergeOut(thing, other);
                }
                if (thing.movement) {
                    thing.movementOld = thing.movement;
                    thing.movement = thing.FSM.movements.moveSimple;
                    thing.FSM.TimeHandler.addEventInterval(function () {
                        if (thing.resting === other) {
                            return false;
                        }
                        thing.FSM.TimeHandler.addEvent(function () {
                            thing.movement = thing.movementOld;
                        }, 1);
                        return true;
                    }, 1, Infinity);
                }
                return true;
            }, 1, Infinity);
        };
        Animations.prototype.animateEmergeCoin = function (thing, other) {
            thing.nocollide = thing.alive = thing.nofall = true;
            thing.yvel -= thing.FSM.unitsize;
            thing.FSM.switchClass(thing, "still", "anim");
            thing.FSM.GroupHolder.switchMemberGroup(thing, "Character", "Scenery");
            thing.FSM.AudioPlayer.play("Coin");
            thing.FSM.ItemsHolder.increase("coins", 1);
            thing.FSM.ItemsHolder.increase("score", 200);
            thing.FSM.TimeHandler.cancelClassCycle(thing, "0");
            thing.FSM.TimeHandler.addClassCycle(thing, [
                "anim1", "anim2", "anim3", "anim4", "anim3", "anim2"
            ], "0", 5);
            thing.FSM.TimeHandler.addEventInterval(function () {
                thing.FSM.movements.moveCoinEmerge(thing, other);
                return !thing.FSM.physics.isThingAlive(thing);
            }, 1, Infinity);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.FSM.deaths.killNormal(thing);
            }, 49);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.yvel *= -1;
            }, 25);
        };
        Animations.prototype.animateEmergeVine = function (thing, solid) {
            thing.attachedSolid = solid;
            thing.FSM.setHeight(thing, 0);
            thing.FSM.AudioPlayer.play("Vine Emerging");
            thing.FSM.TimeHandler.addEvent(function () {
                thing.nocollide = false;
            }, 14);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.movement = undefined;
            }, 700);
        };
        Animations.prototype.animateFlicker = function (thing, cleartime, interval) {
            cleartime = Math.round(cleartime) || 49;
            interval = Math.round(interval) || 2;
            thing.flickering = true;
            thing.FSM.TimeHandler.addEventInterval(function () {
                thing.hidden = !thing.hidden;
                thing.FSM.PixelDrawer.setThingSprite(thing);
            }, interval, cleartime);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.flickering = thing.hidden = false;
                thing.FSM.PixelDrawer.setThingSprite(thing);
            }, cleartime * interval + 1);
        };
        Animations.prototype.animateThrowingHammer = function (thing, count) {
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            if (thing.FSM.physics.isThingAlive(thing.FSM.player)
                && thing.right >= thing.FSM.unitsize * -32
                && count !== 3) {
                thing.FSM.switchClass(thing, "thrown", "throwing");
            }
            thing.FSM.TimeHandler.addEvent(function () {
                if (!thing.FSM.physics.isThingAlive(thing)) {
                    return;
                }
                if (count > 0) {
                    thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateThrowingHammer, 7, thing, count - 1);
                }
                else {
                    thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateThrowingHammer, 70, thing, 7);
                    thing.FSM.removeClass(thing, "thrown");
                }
                if (!thing.FSM.physics.isThingAlive(thing.FSM.player) || thing.right < thing.FSM.unitsize * -32) {
                    thing.FSM.switchClass(thing, "throwing", "thrown");
                    return;
                }
                if (count === 3) {
                    return;
                }
                thing.FSM.switchClass(thing, "throwing", "thrown");
                thing.FSM.addThing(["Hammer", {
                        "xvel": thing.lookleft
                            ? thing.FSM.unitsize / -1.4
                            : thing.FSM.unitsize / 1.4,
                        "yvel": thing.FSM.unitsize * -1.4,
                        "gravity": thing.FSM.MapScreener.gravity / 2.1
                    }], thing.left - thing.FSM.unitsize * 2, thing.top - thing.FSM.unitsize * 2);
            }, 14);
            return false;
        };
        Animations.prototype.animateBowserJump = function (thing) {
            if (!thing.lookleft || !thing.FSM.physics.isThingAlive(thing.FSM.player)) {
                return false;
            }
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            thing.resting = undefined;
            thing.yvel = thing.FSM.unitsize * -1.4;
            thing.nocollidesolid = true;
            thing.FSM.TimeHandler.addEventInterval(function () {
                if (thing.dead || thing.yvel > thing.FSM.unitsize) {
                    thing.nocollidesolid = false;
                    return true;
                }
                return false;
            }, 3, Infinity);
            return false;
        };
        Animations.prototype.animateBowserFire = function (thing) {
            if (!thing.lookleft || !thing.FSM.physics.isThingAlive(thing.FSM.player)) {
                return false;
            }
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            thing.FSM.addClass(thing, "firing");
            thing.FSM.AudioPlayer.playLocal("Bowser Fires", thing.left);
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateBowserFireOpen, 14, thing);
            return false;
        };
        Animations.prototype.animateBowserFireOpen = function (thing) {
            var unitsize = thing.FSM.unitsize, ylev = Math.max(-thing.height * unitsize, Math.round(thing.FSM.player.bottom / (unitsize * 8))
                * unitsize * 8);
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            thing.FSM.removeClass(thing, "firing");
            thing.FSM.addThing(["BowserFire", {
                    "ylev": ylev
                }], thing.left - thing.FSM.unitsize * 8, thing.top + thing.FSM.unitsize * 4);
            return false;
        };
        Animations.prototype.animateBowserThrow = function (thing) {
            if (!thing.lookleft || !thing.FSM.player || !thing.FSM.physics.isThingAlive(thing.FSM.player)) {
                return false;
            }
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            var hammer = thing.FSM.addThing("Hammer", thing.left + thing.FSM.unitsize * 2, thing.top - thing.FSM.unitsize * 2);
            thing.FSM.TimeHandler.addEventInterval(function () {
                if (!thing.FSM.physics.isThingAlive(thing)) {
                    thing.FSM.deaths.killNormal(hammer);
                    return true;
                }
                thing.FSM.setTop(hammer, thing.top - thing.FSM.unitsize * 2);
                if (thing.lookleft) {
                    thing.FSM.setLeft(hammer, thing.left + thing.FSM.unitsize * 2);
                }
                else {
                    thing.FSM.setLeft(hammer, thing.right - thing.FSM.unitsize * 2);
                }
                return true;
            }, 1, 14);
            thing.FSM.TimeHandler.addEvent(function () {
                hammer.xvel = thing.FSM.unitsize * 1.17;
                hammer.yvel = thing.FSM.unitsize * -2.1;
                if (thing.lookleft) {
                    hammer.xvel *= -1;
                }
            }, 14);
            return false;
        };
        Animations.prototype.animateBowserFreeze = function (thing) {
            thing.nofall = true;
            thing.nothrow = true;
            thing.movement = undefined;
            thing.dead = true;
            thing.FSM.animations.animateCharacterPauseVelocity(thing);
            thing.FSM.ScenePlayer.addCutsceneSetting("bowser", thing);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.nofall = false;
            }, 70);
        };
        Animations.prototype.animateJump = function (thing) {
            if (!thing.FSM.physics.isThingAlive(thing) || !thing.FSM.physics.isThingAlive(thing.FSM.player)) {
                return true;
            }
            if (!thing.resting) {
                return false;
            }
            if (thing.FSM.MapScreener.floor - (thing.bottom / thing.FSM.unitsize) >= 30
                && thing.resting.title !== "Floor"
                && thing.FSM.NumberMaker.randomBoolean()) {
                thing.falling = true;
                thing.yvel = thing.FSM.unitsize * -.7;
                thing.FSM.TimeHandler.addEvent(function () {
                    thing.falling = false;
                }, 42);
            }
            else {
                thing.nocollidesolid = true;
                thing.yvel = thing.FSM.unitsize * -2.1;
                thing.FSM.TimeHandler.addEvent(function () {
                    thing.nocollidesolid = false;
                }, 42);
            }
            thing.resting = undefined;
            return false;
        };
        Animations.prototype.animateBlooperUnsqueezing = function (thing) {
            thing.counter = 0;
            thing.squeeze = 0;
            thing.FSM.removeClass(thing, "squeeze");
            thing.FSM.setHeight(thing, 12, true, true);
        };
        Animations.prototype.animatePodobooJumpUp = function (thing) {
            thing.starty = thing.top;
            thing.yvel = thing.speed * -1;
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animatePodobooJumpDown, thing.jumpHeight, thing);
        };
        Animations.prototype.animatePodobooJumpDown = function (thing) {
            thing.movement = thing.FSM.movements.movePodobooFalling;
        };
        Animations.prototype.animateLakituThrowingSpiny = function (thing) {
            if (thing.fleeing || !thing.FSM.physics.isThingAlive(thing)) {
                return true;
            }
            thing.FSM.switchClass(thing, "out", "hiding");
            thing.FSM.TimeHandler.addEvent(function () {
                if (thing.dead) {
                    return;
                }
                var spawn = thing.FSM.addThing("SpinyEgg", thing.left, thing.top);
                spawn.yvel = thing.FSM.unitsize * -2.1;
                thing.FSM.switchClass(thing, "hiding", "out");
            }, 21);
        };
        Animations.prototype.animateSpinyEggHatching = function (thing) {
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return;
            }
            var spawn = thing.FSM.addThing("Spiny", thing.left, thing.top - thing.yvel);
            spawn.moveleft = thing.FSM.objectToLeft(thing.FSM.player, spawn);
            thing.FSM.deaths.killNormal(thing);
        };
        Animations.prototype.animateFireballEmerge = function (thing) {
            thing.FSM.AudioPlayer.play("Fireball");
        };
        Animations.prototype.animateFireballExplode = function (thing, big) {
            thing.nocollide = true;
            thing.FSM.deaths.killNormal(thing);
            if (big === 2) {
                return;
            }
            var output = thing.FSM.addThing("Firework");
            thing.FSM.setMidXObj(output, thing);
            thing.FSM.setMidYObj(output, thing);
            output.animate(output);
        };
        Animations.prototype.animateFirework = function (thing) {
            var name = thing.className + " n", i;
            for (i = 0; i < 3; i += 1) {
                thing.FSM.TimeHandler.addEvent(function (i) {
                    thing.FSM.setClass(thing, name + (i + 1).toString());
                }, i * 7, i);
            }
            thing.FSM.AudioPlayer.play("Firework");
            thing.FSM.TimeHandler.addEvent(function () {
                thing.FSM.deaths.killNormal(thing);
            }, i * 7);
        };
        Animations.prototype.animateCannonFiring = function (thing) {
            if (!thing.FSM.physics.isThingAlive(thing)) {
                return;
            }
            if (thing.FSM.player.right > (thing.left - thing.FSM.unitsize * 8)
                && thing.FSM.player.left < (thing.right + thing.FSM.unitsize * 8)) {
                return;
            }
            var spawn = thing.FSM.ObjectMaker.make("BulletBill");
            if (thing.FSM.objectToLeft(thing.FSM.player, thing)) {
                spawn.direction = 1;
                spawn.moveleft = true;
                spawn.xvel *= -1;
                thing.FSM.flipHoriz(spawn);
                thing.FSM.addThing(spawn, thing.left, thing.top);
            }
            else {
                thing.FSM.addThing(spawn, thing.left + thing.width, thing.top);
            }
            thing.FSM.AudioPlayer.playLocal("Bump", thing.right);
        };
        Animations.prototype.animatePlayerFire = function (thing) {
            if (thing.numballs >= 2) {
                return;
            }
            var xloc = thing.moveleft
                ? (thing.left - thing.FSM.unitsize / 4)
                : (thing.right + thing.FSM.unitsize / 4), ball = thing.FSM.ObjectMaker.make("Fireball", {
                "moveleft": thing.moveleft,
                "speed": thing.FSM.unitsize * 1.75,
                "jumpheight": thing.FSM.unitsize * 1.56,
                "gravity": thing.FSM.MapScreener.gravity * 1.56,
                "yvel": thing.FSM.unitsize,
                "movement": thing.FSM.movements.moveJumping
            });
            thing.FSM.addThing(ball, xloc, thing.top + thing.FSM.unitsize * 8);
            ball.animate(ball);
            ball.onDelete = function () {
                thing.numballs -= 1;
            };
            thing.numballs += 1;
            thing.FSM.addClass(thing, "firing");
            thing.FSM.TimeHandler.addEvent(function () {
                thing.FSM.removeClass(thing, "firing");
            }, 7);
        };
        Animations.prototype.animateCastleBlock = function (thing, balls) {
            var midx = thing.EightBitter.getMidX(thing), midy = thing.EightBitter.getMidY(thing), ax = Math.cos(thing.angle * Math.PI) * thing.FSM.unitsize * 4, ay = Math.sin(thing.angle * Math.PI) * thing.FSM.unitsize * 4, i;
            for (i = 0; i < balls.length; i += 1) {
                thing.FSM.setMidX(balls[i], midx + ax * i);
                thing.FSM.setMidY(balls[i], midy + ay * i);
            }
            thing.angle += thing.dt * thing.direction;
        };
        Animations.prototype.animateCastleBridgeOpen = function (thing) {
            thing.FSM.ScenePlayer.playRoutine("CastleBridgeOpen", thing);
        };
        Animations.prototype.animateCastleChainOpen = function (thing) {
            thing.FSM.TimeHandler.addEvent(thing.FSM.deaths.killNormal, 3, thing);
        };
        Animations.prototype.animatePlayerPaddling = function (thing) {
            if (!thing.paddlingCycle) {
                thing.FSM.removeClasses(thing, "skidding paddle1 paddle2 paddle3 paddle4 paddle5");
                thing.FSM.addClass(thing, "paddling");
                thing.FSM.TimeHandler.cancelClassCycle(thing, "paddlingCycle");
                thing.FSM.TimeHandler.addClassCycle(thing, [
                    "paddle1", "paddle2", "paddle3", "paddle2", "paddle1",
                    function () { return thing.paddlingCycle = false; }
                ], "paddlingCycle", 7);
            }
            thing.paddling = thing.paddlingCycle = thing.swimming = true;
            thing.yvel = thing.FSM.unitsize * -.84;
        };
        Animations.prototype.animatePlayerLanding = function (thing) {
            if (thing.crouching && thing.power > 1) {
                thing.FSM.setHeight(thing, 11, true, true);
            }
            if (thing.FSM.hasClass(thing, "hopping")) {
                thing.FSM.switchClass(thing, "hopping", "jumping");
            }
            if (thing.FSM.MapScreener.underwater) {
                thing.FSM.removeClass(thing, "paddling");
            }
            thing.FSM.ModAttacher.fireEvent("onPlayerLanding", thing, thing.resting);
        };
        Animations.prototype.animatePlayerRestingOff = function (thing) {
            thing.resting = undefined;
            if (thing.FSM.MapScreener.underwater) {
                thing.FSM.switchClass(thing, "running", "paddling");
            }
        };
        Animations.prototype.animatePlayerBubbling = function (thing) {
            thing.FSM.addThing("Bubble", thing.right, thing.top);
        };
        Animations.prototype.animatePlayerRunningCycle = function (thing) {
            thing.FSM.switchClass(thing, "still", "running");
            thing.running = thing.FSM.TimeHandler.addClassCycle(thing, [
                "one", "two", "three", "two"
            ], "running", function () {
                return 5 + Math.ceil(thing.maxspeedsave - Math.abs(thing.xvel));
            });
        };
        Animations.prototype.animateCharacterPauseVelocity = function (thing, keepMovement) {
            thing.xvelOld = thing.xvel || 0;
            thing.yvelOld = thing.yvel || 0;
            thing.nofallOld = thing.nofall || false;
            thing.nocollideOld = thing.nocollide || false;
            thing.movementOld = thing.movement || thing.movementOld;
            thing.nofall = thing.nocollide = true;
            thing.xvel = thing.yvel = 0;
            if (!keepMovement) {
                thing.movement = undefined;
            }
        };
        Animations.prototype.animateCharacterResumeVelocity = function (thing, noVelocity) {
            if (!noVelocity) {
                thing.xvel = thing.xvelOld || 0;
                thing.yvel = thing.yvelOld || 0;
            }
            thing.movement = thing.movementOld || thing.movement;
            thing.nofall = thing.nofallOld || false;
            thing.nocollide = thing.nocollideOld || false;
        };
        Animations.prototype.animateCharacterHop = function (thing) {
            thing.resting = undefined;
            thing.yvel = thing.FSM.unitsize * -1.4;
        };
        Animations.prototype.animatePlayerPipingStart = function (thing) {
            thing.nocollide = thing.nofall = thing.piping = true;
            thing.xvel = thing.yvel = 0;
            thing.movementOld = thing.movement;
            thing.movement = undefined;
            if (thing.power > 1) {
                thing.FSM.animations.animatePlayerRemoveCrouch(thing);
                thing.FSM.setPlayerSizeLarge(thing);
            }
            else {
                thing.FSM.setPlayerSizeSmall(thing);
            }
            thing.FSM.removeClasses(thing, "jumping running crouching");
            thing.FSM.AudioPlayer.clearTheme();
            thing.FSM.TimeHandler.cancelAllCycles(thing);
            thing.FSM.GroupHolder.switchMemberGroup(thing, "Character", "Scenery");
        };
        Animations.prototype.animatePlayerPipingEnd = function (thing) {
            thing.movement = thing.movementOld;
            thing.nocollide = thing.nofall = thing.piping = false;
            thing.FSM.AudioPlayer.resumeTheme();
            thing.FSM.GroupHolder.switchMemberGroup(thing, "Scenery", "Character");
        };
        Animations.prototype.animatePlayerOffPole = function (thing, doRun) {
            thing.FSM.removeClasses(thing, "climbing running");
            thing.FSM.addClass(thing, "jumping");
            thing.xvel = 1.4;
            thing.yvel = -.7;
            thing.nocollide = thing.nofall = false;
            thing.gravity = thing.FSM.MapScreener.gravity / 14;
            thing.FSM.TimeHandler.addEvent(function () {
                thing.movement = thing.FSM.movements.movePlayer;
                thing.gravity = thing.FSM.MapScreener.gravity;
                thing.FSM.unflipHoriz(thing);
                if (doRun) {
                    thing.FSM.animations.animatePlayerRunningCycle(thing);
                }
            }, 21);
        };
        Animations.prototype.animatePlayerOffVine = function (thing) {
            thing.FSM.flipHoriz(thing);
            thing.FSM.shiftHoriz(thing, (thing.width - 1) * thing.FSM.unitsize);
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animatePlayerOffPole, 14, thing);
        };
        return Animations;
    })();
    FullScreenMario.Animations = Animations;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Collisions = (function () {
        function Collisions() {
        }
        Collisions.prototype.collideFriendly = function (thing, other) {
            if (!thing.player || !thing.FSM.physics.isThingAlive(other)) {
                return;
            }
            if (other.action) {
                other.action(thing, other);
            }
            other.death(other);
        };
        Collisions.prototype.collideCharacterSolid = function (thing, other) {
            if (other.up === thing) {
                return;
            }
            if (thing.FSM.physics.isCharacterOnSolid(thing, other)) {
                if (other.hidden && !other.collideHidden) {
                    return;
                }
                if (thing.resting !== other) {
                    thing.resting = other;
                    if (thing.onResting) {
                        thing.onResting(thing, other);
                    }
                    if (other.onRestedUpon) {
                        other.onRestedUpon(other, thing);
                    }
                }
            }
            else if (thing.FSM.physics.isSolidOnCharacter(other, thing)) {
                var midx = thing.FSM.getMidX(thing);
                if (midx > other.left && midx < other.right) {
                    thing.undermid = other;
                }
                else if (other.hidden && !other.collideHidden) {
                    return;
                }
                if (!thing.under) {
                    thing.under = [other];
                }
                else {
                    thing.under.push(other);
                }
                if (thing.player) {
                    thing.keys.jump = false;
                    thing.FSM.setTop(thing, other.bottom - thing.toly + other.yvel);
                }
                thing.yvel = other.yvel;
            }
            if (other.hidden && !other.collideHidden) {
                return;
            }
            if (thing.resting !== other
                && !thing.FSM.physics.isCharacterBumpingSolid(thing, other)
                && !thing.FSM.physics.isThingOnThing(thing, other)
                && !thing.FSM.physics.isThingOnThing(other, thing)
                && !thing.under) {
                if (thing.right <= other.right) {
                    thing.xvel = Math.min(thing.xvel, 0);
                    thing.FSM.shiftHoriz(thing, Math.max(other.left + thing.FSM.unitsize - thing.right, thing.FSM.unitsize / -2));
                }
                else {
                    thing.xvel = Math.max(thing.xvel, 0);
                    thing.FSM.shiftHoriz(thing, Math.min(other.right - thing.FSM.unitsize - thing.left, thing.FSM.unitsize / 2));
                }
                if (!thing.player) {
                    if (!thing.noflip) {
                        thing.moveleft = !thing.moveleft;
                    }
                    if (thing.item) {
                        thing.collide(other, thing);
                    }
                }
                else if (other.actionLeft) {
                    thing.FSM.ModAttacher.fireEvent("onPlayerActionLeft", thing, other);
                    other.actionLeft(thing, other, other.transport);
                }
            }
        };
        Collisions.prototype.collideCharacterSolidUp = function (thing, other) {
            if (thing.onCollideUp) {
                thing.onCollideUp(thing, other);
            }
            else {
                thing.FSM.scoring.scoreOn(thing.scoreBelow, thing);
                thing.death(thing, 2);
            }
        };
        Collisions.prototype.collideUpItem = function (thing, other) {
            thing.FSM.animations.animateCharacterHop(thing);
            thing.moveleft = thing.FSM.objectToLeft(thing, other);
        };
        Collisions.prototype.collideUpCoin = function (thing, other) {
            thing.blockparent = other;
            thing.animate(thing, other);
        };
        Collisions.prototype.collideCoin = function (thing, other) {
            if (!thing.player) {
                return;
            }
            thing.FSM.AudioPlayer.play("Coin");
            thing.FSM.ItemsHolder.increase("score", 200);
            thing.FSM.ItemsHolder.increase("coins", 1);
            thing.FSM.deaths.killNormal(other);
        };
        Collisions.prototype.collideStar = function (thing, other) {
            if (!thing.player || thing.star) {
                return;
            }
            thing.FSM.playerStarUp(thing);
            thing.FSM.ModAttacher.fireEvent("onCollideStar", thing, other);
        };
        Collisions.prototype.collideFireball = function (thing, other) {
            if (!thing.FSM.physics.isThingAlive(thing) || thing.height < thing.FSM.unitsize) {
                return;
            }
            if (thing.nofire) {
                if (thing.nofire > 1) {
                    other.death(other);
                }
                return;
            }
            if (thing.nofiredeath) {
                thing.FSM.AudioPlayer.playLocal("Bump", thing.FSM.getMidX(other));
                thing.death(thing);
            }
            else {
                thing.FSM.AudioPlayer.playLocal("Kick", thing.FSM.getMidX(other));
                thing.death(thing, 2);
                thing.FSM.scoring.scoreOn(thing.scoreFire, thing);
            }
            other.death(other);
        };
        Collisions.prototype.collideCastleFireball = function (thing, other) {
            if (thing.star) {
                other.death(other);
            }
            else {
                thing.death(thing);
            }
        };
        Collisions.prototype.collideShell = function (thing, other) {
            if (thing.shell) {
                if (other.shell) {
                    return thing.FSM.collisions.collideShellShell(thing, other);
                }
                return thing.FSM.collisions.collideShell(thing, other);
            }
            if (thing.groupType === "Solid") {
                return thing.FSM.collisions.collideShellSolid(thing, other);
            }
            if (thing.player) {
                return thing.FSM.collisions.collideShellPlayer(thing, other);
            }
            if (other.xvel) {
                thing.FSM.deaths.killFlip(thing);
                if (thing.shellspawn) {
                    thing = thing.FSM.deaths.killSpawn(thing);
                }
                thing.FSM.AudioPlayer.play("Kick");
                thing.FSM.scoring.scoreOn(thing.FSM.scoring.findScore(other.enemyhitcount), thing);
                other.enemyhitcount += 1;
            }
            else {
                thing.moveleft = thing.FSM.objectToLeft(thing, other);
            }
        };
        Collisions.prototype.collideShellSolid = function (thing, other) {
            if (other.right < thing.right) {
                thing.FSM.AudioPlayer.playLocal("Bump", thing.left);
                thing.FSM.setRight(other, thing.left);
                other.xvel = -other.speed;
                other.moveleft = true;
            }
            else {
                thing.FSM.AudioPlayer.playLocal("Bump", thing.right);
                thing.FSM.setLeft(other, thing.right);
                other.xvel = other.speed;
                other.moveleft = false;
            }
        };
        Collisions.prototype.collideShellPlayer = function (thing, other) {
            var shelltoleft = thing.FSM.objectToLeft(other, thing), playerjump = thing.yvel > 0 && (thing.bottom <= other.top + thing.FSM.unitsize * 2);
            if (thing.star) {
                thing.FSM.scoring.scorePlayerShell(thing, other);
                other.death(other, 2);
                return;
            }
            if (other.landing) {
                if (other.shelltoleft === shelltoleft) {
                    other.landing += 1;
                    if (other.landing === 1) {
                        thing.FSM.scoring.scorePlayerShell(thing, other);
                    }
                    thing.FSM.TimeHandler.addEvent(function (other) {
                        other.landing -= 1;
                    }, 2, other);
                }
                else {
                    thing.death(thing);
                }
                return;
            }
            if (other.xvel === 0 || playerjump) {
                other.counting = 0;
                if (other.xvel === 0) {
                    thing.FSM.AudioPlayer.play("Kick");
                    thing.FSM.scoring.scorePlayerShell(thing, other);
                    if (shelltoleft) {
                        other.moveleft = true;
                        other.xvel = -other.speed;
                    }
                    else {
                        other.moveleft = false;
                        other.xvel = other.speed;
                    }
                    other.hitcount += 1;
                    thing.FSM.TimeHandler.addEvent(function (other) {
                        other.hitcount -= 1;
                    }, 2, other);
                }
                else {
                    other.xvel = 0;
                }
                if (other.peeking) {
                    other.peeking = 0;
                    thing.FSM.removeClass(other, "peeking");
                    other.height -= thing.FSM.unitsize / 8;
                    thing.FSM.updateSize(other);
                }
                if (playerjump) {
                    thing.FSM.AudioPlayer.play("Kick");
                    if (!other.xvel) {
                        thing.FSM.jumpEnemy(thing, other);
                        thing.yvel *= 2;
                        thing.FSM.setBottom(thing, other.top - thing.FSM.unitsize);
                    }
                    else {
                    }
                    other.landing += 1;
                    other.shelltoleft = shelltoleft;
                    thing.FSM.TimeHandler.addEvent(function (other) {
                        other.landing -= 1;
                    }, 2, other);
                }
            }
            else {
                if (!other.hitcount && ((shelltoleft && other.xvel > 0)
                    || (!shelltoleft && other.xvel < 0))) {
                    thing.death(thing);
                }
            }
        };
        Collisions.prototype.collideShellShell = function (thing, other) {
            if (thing.xvel !== 0) {
                if (other.xvel !== 0) {
                    var temp = thing.xvel;
                    thing.xvel = other.xvel;
                    other.xvel = temp;
                    thing.FSM.shiftHoriz(thing, thing.xvel);
                    thing.FSM.shiftHoriz(other, other.xvel);
                }
                else {
                    thing.FSM.ItemsHolder.increase("score", 500);
                    other.death(other);
                }
            }
            else {
                thing.FSM.ItemsHolder.increase("score", 500);
                thing.death(thing);
            }
        };
        Collisions.prototype.collideEnemy = function (thing, other) {
            if (!thing.player && other.player) {
                return thing.FSM.collisions.collideEnemy(thing, other);
            }
            if (!thing.FSM.physics.isThingAlive(thing) || !thing.FSM.physics.isThingAlive(other)) {
                return;
            }
            if (thing.item) {
                if (thing.collidePrimary) {
                    return thing.collide(other, thing);
                }
                return;
            }
            if (!thing.player) {
                thing.moveleft = thing.FSM.objectToLeft(thing, other);
                other.moveleft = !thing.moveleft;
                return;
            }
            if ((thing.star && !other.nostar)
                || (!thing.FSM.MapScreener.underwater
                    && (!other.deadly && thing.FSM.physics.isThingOnThing(thing, other)))) {
                var player = thing;
                if (player.FSM.physics.isCharacterAboveEnemy(player, other)) {
                    return;
                }
                if (player.star) {
                    other.nocollide = true;
                    other.death(other, 2);
                    player.FSM.scoring.scoreOn(other.scoreStar, other);
                    player.FSM.AudioPlayer.play("Kick");
                }
                else {
                    player.FSM.setBottom(player, Math.min(player.bottom, other.top + player.FSM.unitsize));
                    player.FSM.TimeHandler.addEvent(player.FSM.jumpEnemy, 0, player, other);
                    other.death(other, player.star ? 2 : 0);
                    player.FSM.addClass(player, "hopping");
                    player.FSM.removeClasses(player, "running skidding jumping one two three");
                    player.hopping = true;
                    if (player.power === 1) {
                        player.FSM.setPlayerSizeSmall(player);
                    }
                }
            }
            else if (!thing.FSM.physics.isCharacterAboveEnemy(thing, other)) {
                thing.death(thing);
            }
        };
        Collisions.prototype.collideBottomBrick = function (thing, other) {
            if (other.solid && !thing.solid) {
                return thing.FSM.collisions.collideBottomBrick(other, thing);
            }
            if (thing.up || !other.player) {
                return;
            }
            thing.FSM.AudioPlayer.play("Bump");
            if (thing.used) {
                return;
            }
            thing.up = other;
            if (other.power > 1 && thing.breakable && !thing.contents) {
                thing.FSM.TimeHandler.addEvent(thing.FSM.deaths.killBrick, 2, thing, other);
                return;
            }
            thing.FSM.animations.animateSolidBump(thing);
            if (thing.contents) {
                thing.FSM.TimeHandler.addEvent(function () {
                    thing.FSM.animations.animateSolidContents(thing, other);
                    if (thing.contents !== "Coin") {
                        thing.FSM.animations.animateBlockBecomesUsed(thing);
                    }
                    else {
                        if (thing.lastcoin) {
                            thing.FSM.animations.animateBlockBecomesUsed(thing);
                        }
                        else {
                            thing.FSM.TimeHandler.addEvent(function () {
                                thing.lastcoin = true;
                            }, 245);
                        }
                    }
                }, 7);
            }
        };
        Collisions.prototype.collideBottomBlock = function (thing, other) {
            if (other.solid && !thing.solid) {
                return thing.FSM.collisions.collideBottomBlock(other, thing);
            }
            if (thing.up || !other.player) {
                return;
            }
            if (thing.used) {
                thing.FSM.AudioPlayer.play("Bump");
                return;
            }
            thing.used = true;
            thing.hidden = false;
            thing.up = other;
            thing.FSM.animations.animateSolidBump(thing);
            thing.FSM.removeClass(thing, "hidden");
            thing.FSM.switchClass(thing, "unused", "used");
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateSolidContents, 7, thing, other);
        };
        Collisions.prototype.collideVine = function (thing, other) {
            if (!thing.player || thing.attachedSolid || thing.climbing) {
                return;
            }
            if (thing.bottom > other.bottom + thing.FSM.unitsize * 2) {
                return;
            }
            other.attachedCharacter = thing;
            thing.attachedSolid = other;
            thing.nofall = true;
            thing.checkOverlaps = false;
            thing.resting = undefined;
            if (thing.right < other.right) {
                thing.lookleft = false;
                thing.moveleft = false;
                thing.attachedDirection = -1;
                thing.FSM.unflipHoriz(thing);
            }
            else {
                thing.lookleft = true;
                thing.moveleft = true;
                thing.attachedDirection = 1;
                thing.FSM.flipHoriz(thing);
            }
            thing.FSM.animations.animateCharacterPauseVelocity(thing);
            thing.FSM.addClass(thing, "climbing");
            thing.FSM.removeClasses(thing, "running", "jumping", "skidding");
            thing.FSM.TimeHandler.cancelClassCycle(thing, "running");
            thing.FSM.TimeHandler.addClassCycle(thing, ["one", "two"], "climbing", 0);
            thing.attachedLeft = !thing.FSM.objectToLeft(thing, other);
            thing.attachedOff = thing.attachedLeft ? 1 : -1;
            thing.movement = thing.FSM.movements.movePlayerVine;
        };
        Collisions.prototype.collideSpringboard = function (thing, other) {
            if (thing.player && thing.yvel >= 0 && !other.tension
                && thing.FSM.physics.isCharacterOnSolid(thing, other)) {
                other.tension = other.tensionSave = Math.max(thing.yvel * 0.77, thing.FSM.unitsize);
                thing.movement = thing.FSM.movements.movePlayerSpringboardDown;
                thing.spring = other;
                thing.xvel /= 2.8;
            }
            else {
                thing.FSM.collisions.collideCharacterSolid(thing, other);
            }
        };
        Collisions.prototype.collideWaterBlocker = function (thing, other) {
            thing.FSM.collisions.collideCharacterSolid(thing, other);
        };
        Collisions.prototype.collideFlagpole = function (thing, other) {
            if (thing.bottom > other.bottom) {
                return;
            }
            thing.FSM.ScenePlayer.startCutscene("Flagpole", {
                "player": thing,
                "collider": other
            });
        };
        Collisions.prototype.collideCastleAxe = function (thing, other) {
            if (!thing.FSM.MathDecider.compute("canPlayerTouchCastleAxe", thing, other)) {
                return;
            }
            thing.FSM.ScenePlayer.startCutscene("BowserVictory", {
                "player": thing,
                "axe": other
            });
        };
        Collisions.prototype.collideCastleDoor = function (thing, other) {
            thing.FSM.deaths.killNormal(thing);
            if (!thing.player) {
                return;
            }
            var time = thing.FSM.ItemsHolder.getItem("time");
            thing.FSM.ScenePlayer.addCutsceneSetting("player", thing);
            thing.FSM.ScenePlayer.addCutsceneSetting("detector", other);
            thing.FSM.ScenePlayer.addCutsceneSetting("time", time);
            if (time === Infinity) {
                thing.FSM.ScenePlayer.playRoutine("Fireworks");
            }
            else {
                thing.FSM.ScenePlayer.playRoutine("Countdown");
            }
        };
        Collisions.prototype.collideCastleNPC = function (thing, other) {
            var keys = other.collection.npc.collectionKeys;
            thing.FSM.ScenePlayer.addCutsceneSetting("keys", keys);
            thing.FSM.ScenePlayer.addCutsceneSetting("player", thing);
            thing.FSM.ScenePlayer.addCutsceneSetting("detector", other);
            thing.FSM.ScenePlayer.playRoutine("Dialog");
        };
        Collisions.prototype.collideTransport = function (thing, other) {
            if (!thing.player) {
                return;
            }
            thing.FSM.collisions.collideCharacterSolid(thing, other);
            if (thing.resting !== other) {
                return;
            }
            other.xvel = thing.FSM.unitsize / 2;
            other.movement = thing.FSM.movements.movePlatform;
            other.collide = thing.FSM.collisions.collideCharacterSolid;
        };
        Collisions.prototype.collideDetector = function (thing, other) {
            if (!thing.player) {
                if (other.activateFail) {
                    other.activateFail(thing);
                }
                return;
            }
            other.activate(thing, other);
            if (!other.noActivateDeath) {
                thing.FSM.deaths.killNormal(other);
            }
        };
        Collisions.prototype.collideLevelTransport = function (thing, other) {
            if (!thing.player) {
                return;
            }
            var transport = other.transport;
            if (typeof transport === "undefined") {
                throw new Error("No transport given to collideLevelTransport");
            }
            if (transport.constructor === String) {
                thing.FSM.setLocation(transport);
            }
            else if (typeof transport.map !== "undefined") {
                if (typeof transport.location !== "undefined") {
                    thing.FSM.setMap(transport.map, transport.location);
                }
                else {
                    thing.FSM.setMap(transport.map);
                }
            }
            else if (typeof transport.location !== "undefined") {
                thing.FSM.setLocation(transport.location);
            }
            else {
                throw new Error("Unknown transport type:" + transport);
            }
        };
        return Collisions;
    })();
    FullScreenMario.Collisions = Collisions;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Cutscenes = (function () {
        function Cutscenes() {
        }
        Cutscenes.prototype.cutsceneFlagpoleStartSlidingDown = function (FSM, settings) {
            var thing = settings.player, other = settings.collider, height = (other.bottom - thing.bottom) | 0, scoreAmount = FSM.scoring.scorePlayerFlag(thing, height / FSM.unitsize), scoreThing = FSM.ObjectMaker.make("Text" + scoreAmount);
            thing.star = 1;
            thing.nocollidechar = true;
            FSM.MapScreener.nokeys = true;
            FSM.MapScreener.notime = true;
            FSM.MapScreener.canscroll = false;
            FSM.deaths.killNPCs();
            FSM.animations.animateCharacterPauseVelocity(thing);
            FSM.setRight(thing, other.left + FSM.unitsize * 3);
            FSM.deaths.killNormal(other);
            FSM.removeClasses(thing, "running jumping skidding");
            FSM.addClass(thing, "climbing animated");
            FSM.TimeHandler.addClassCycle(thing, ["one", "two"], "climbing", 0);
            FSM.TimeHandler.addEventInterval(FSM.shiftVert, 1, 64, other.collection.Flag, FSM.unitsize);
            FSM.addThing(scoreThing, other.right, other.bottom);
            FSM.TimeHandler.addEventInterval(FSM.shiftVert, 1, 72, scoreThing, -FSM.unitsize);
            FSM.TimeHandler.addEvent(FSM.ItemsHolder.increase.bind(FSM.ItemsHolder), 72, "score", scoreAmount);
            FSM.AudioPlayer.clearAll();
            FSM.AudioPlayer.clearTheme();
            FSM.AudioPlayer.play("Flagpole");
            FSM.TimeHandler.addEventInterval(function () {
                if (thing.bottom < other.bottom) {
                    FSM.shiftVert(thing, FSM.unitsize);
                    return false;
                }
                if ((other.collection.Flag.bottom | 0) < (other.bottom | 0)) {
                    return false;
                }
                thing.movement = undefined;
                FSM.setBottom(thing, other.bottom);
                FSM.TimeHandler.cancelClassCycle(thing, "climbing");
                FSM.TimeHandler.addEvent(FSM.ScenePlayer.bindRoutine("HitBottom"), 21);
                return true;
            }, 1, Infinity);
        };
        Cutscenes.prototype.cutsceneFlagpoleHitBottom = function (FSM, settings) {
            var thing = settings.player;
            thing.keys.run = 1;
            thing.maxspeed = thing.walkspeed;
            thing.FSM.flipHoriz(thing);
            thing.FSM.shiftHoriz(thing, (thing.width + 1) * thing.FSM.unitsize);
            thing.FSM.TimeHandler.addEvent(function () {
                thing.FSM.AudioPlayer.play("Stage Clear");
                thing.FSM.animations.animatePlayerOffPole(thing, true);
            }, 14);
        };
        Cutscenes.prototype.cutsceneFlagpoleCountdown = function (FSM, settings) {
            FSM.TimeHandler.addEventInterval(function () {
                FSM.ItemsHolder.decrease("time");
                FSM.ItemsHolder.increase("score", 50);
                FSM.AudioPlayer.play("Coin");
                if (FSM.ItemsHolder.getItem("time") > 0) {
                    return false;
                }
                FSM.TimeHandler.addEvent(FSM.ScenePlayer.bindRoutine("Fireworks"), 35);
                return true;
            }, 1, Infinity);
        };
        Cutscenes.prototype.cutsceneFlagpoleFireworks = function (FSM, settings) {
            var numFireworks = FSM.MathDecider.compute("numberOfFireworks", settings.time), player = settings.player, detector = settings.detector, doorRight = detector.left, doorLeft = doorRight - FSM.unitsize * 8, doorBottom = detector.bottom, doorTop = doorBottom - FSM.unitsize * 16, flag = FSM.ObjectMaker.make("CastleFlag", {
                "position": "beginning"
            }), flagMovements = 28, fireInterval = 28, fireworkPositions = [
                [0, -48],
                [-8, -40],
                [8, -40],
                [-8, -32],
                [0, -48],
                [-8, -40]
            ], i = 0, firework, position;
            FSM.addThing(flag, doorLeft + FSM.unitsize, doorTop - FSM.unitsize * 24);
            FSM.arrayToBeginning(flag, FSM.GroupHolder.getGroup(flag.groupType));
            FSM.TimeHandler.addEventInterval(function () {
                FSM.shiftVert(flag, FSM.unitsize * -.25);
            }, 1, flagMovements);
            if (numFireworks > 0) {
                FSM.TimeHandler.addEventInterval(function () {
                    position = fireworkPositions[i];
                    firework = FSM.addThing("Firework", player.left + position[0] * FSM.unitsize, player.top + position[1] * FSM.unitsize);
                    firework.animate(firework);
                    i += 1;
                }, fireInterval, numFireworks);
            }
            FSM.TimeHandler.addEvent(function () {
                FSM.AudioPlayer.addEventImmediate("Stage Clear", "ended", function () {
                    FSM.collisions.collideLevelTransport(player, detector);
                    FSM.ScenePlayer.stopCutscene();
                });
            }, i * fireInterval + 420);
        };
        Cutscenes.prototype.cutsceneBowserVictoryCollideCastleAxe = function (FSM, settings) {
            var player = settings.player, axe = settings.axe;
            FSM.animations.animateCharacterPauseVelocity(player);
            FSM.deaths.killNormal(axe);
            FSM.deaths.killNPCs();
            FSM.AudioPlayer.clearTheme();
            FSM.MapScreener.nokeys = true;
            FSM.MapScreener.notime = true;
            player.FSM.TimeHandler.addEvent(function () {
                player.keys.run = 1;
                player.maxspeed = player.walkspeed;
                FSM.animations.animateCharacterResumeVelocity(player);
                player.yvel = 0;
                FSM.MapScreener.canscroll = true;
                FSM.AudioPlayer.play("World Clear");
            }, 140);
        };
        Cutscenes.prototype.cutsceneBowserVictoryCastleBridgeOpen = function (FSM, settings) {
            var bridge = settings.routineArguments[0];
            FSM.TimeHandler.addEventInterval(function () {
                bridge.right -= FSM.unitsize * 2;
                FSM.setWidth(bridge, bridge.width - 2);
                FSM.AudioPlayer.play("Break Block");
                if (bridge.width <= 0) {
                    FSM.ScenePlayer.playRoutine("BowserFalls");
                    return true;
                }
                return false;
            }, 1, Infinity);
        };
        Cutscenes.prototype.cutsceneBowserVictoryBowserFalls = function (FSM, settings) {
            FSM.AudioPlayer.play("Bowser Falls");
            if (settings.bowser) {
                settings.bowser.nofall = true;
            }
        };
        Cutscenes.prototype.cutsceneBowserVictoryDialog = function (FSM, settings) {
            var player = settings.player, detector = settings.detector, keys = settings.keys, interval = 140, i = 0, j, letters;
            player.keys.run = 0;
            player.FSM.deaths.killNormal(detector);
            player.FSM.TimeHandler.addEventInterval(function () {
                letters = detector.collection[keys[i]].children;
                for (j = 0; j < letters.length; j += 1) {
                    if (letters[j].title !== "TextSpace") {
                        letters[j].hidden = false;
                    }
                }
                i += 1;
            }, interval, keys.length);
            player.FSM.TimeHandler.addEvent(function () {
                player.FSM.collisions.collideLevelTransport(player, detector);
            }, 280 + interval * keys.length);
        };
        return Cutscenes;
    })();
    FullScreenMario.Cutscenes = Cutscenes;
})(FullScreenMario || (FullScreenMario = {}));
var ObjectMakr;
(function (ObjectMakr_1) {
    "use strict";
    var ObjectMakr = (function () {
        function ObjectMakr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to ObjectMakr.");
            }
            if (typeof settings.inheritance === "undefined") {
                throw new Error("No inheritance given to ObjectMakr.");
            }
            this.inheritance = settings.inheritance;
            this.properties = settings.properties || {};
            this.doPropertiesFull = settings.doPropertiesFull;
            this.indexMap = settings.indexMap;
            this.onMake = settings.onMake;
            this.functions = {};
            if (this.doPropertiesFull) {
                this.propertiesFull = {};
            }
            if (this.indexMap) {
                this.processProperties(this.properties);
            }
            this.processFunctions(this.inheritance, Object, "Object");
        }
        ObjectMakr.prototype.getInheritance = function () {
            return this.inheritance;
        };
        ObjectMakr.prototype.getProperties = function () {
            return this.properties;
        };
        ObjectMakr.prototype.getPropertiesOf = function (title) {
            return this.properties[title];
        };
        ObjectMakr.prototype.getFullProperties = function () {
            return this.propertiesFull;
        };
        ObjectMakr.prototype.getFullPropertiesOf = function (title) {
            return this.doPropertiesFull ? this.propertiesFull[title] : undefined;
        };
        ObjectMakr.prototype.getFunctions = function () {
            return this.functions;
        };
        ObjectMakr.prototype.getFunction = function (name) {
            return this.functions[name];
        };
        ObjectMakr.prototype.hasFunction = function (name) {
            return this.functions.hasOwnProperty(name);
        };
        ObjectMakr.prototype.getIndexMap = function () {
            return this.indexMap;
        };
        ObjectMakr.prototype.make = function (name, settings) {
            var output;
            if (!this.functions.hasOwnProperty(name)) {
                throw new Error("Unknown type given to ObjectMakr: " + name);
            }
            output = new this.functions[name]();
            if (settings) {
                this.proliferate(output, settings);
            }
            if (this.onMake && output[this.onMake]) {
                output[this.onMake](output, name, settings, (this.doPropertiesFull ? this.propertiesFull : this.properties)[name]);
            }
            return output;
        };
        ObjectMakr.prototype.processProperties = function (properties) {
            var name;
            for (name in properties) {
                if (properties.hasOwnProperty(name)) {
                    if (properties[name] instanceof Array) {
                        properties[name] = this.processPropertyArray(properties[name]);
                    }
                }
            }
        };
        ObjectMakr.prototype.processPropertyArray = function (properties) {
            var output = {}, i;
            for (i = properties.length - 1; i >= 0; --i) {
                output[this.indexMap[i]] = properties[i];
            }
            return output;
        };
        ObjectMakr.prototype.processFunctions = function (base, parent, parentName) {
            var name, ref;
            for (name in base) {
                if (base.hasOwnProperty(name)) {
                    this.functions[name] = (new Function());
                    this.functions[name].prototype = new parent();
                    this.functions[name].prototype.constructor = this.functions[name];
                    for (ref in this.properties[name]) {
                        if (this.properties[name].hasOwnProperty(ref)) {
                            this.functions[name].prototype[ref] = this.properties[name][ref];
                        }
                    }
                    if (this.doPropertiesFull) {
                        this.propertiesFull[name] = {};
                        if (parentName) {
                            for (ref in this.propertiesFull[parentName]) {
                                if (this.propertiesFull[parentName].hasOwnProperty(ref)) {
                                    this.propertiesFull[name][ref] = this.propertiesFull[parentName][ref];
                                }
                            }
                        }
                        for (ref in this.properties[name]) {
                            if (this.properties[name].hasOwnProperty(ref)) {
                                this.propertiesFull[name][ref] = this.properties[name][ref];
                            }
                        }
                    }
                    this.processFunctions(base[name], this.functions[name], name);
                }
            }
        };
        ObjectMakr.prototype.proliferate = function (recipient, donor, noOverride) {
            var setting, i;
            for (i in donor) {
                if (noOverride && recipient.hasOwnProperty(i)) {
                    continue;
                }
                setting = donor[i];
                if (typeof setting === "object") {
                    if (!recipient.hasOwnProperty(i)) {
                        recipient[i] = new setting.constructor();
                    }
                    this.proliferate(recipient[i], setting, noOverride);
                }
                else {
                    recipient[i] = setting;
                }
            }
            return recipient;
        };
        return ObjectMakr;
    })();
    ObjectMakr_1.ObjectMakr = ObjectMakr;
})(ObjectMakr || (ObjectMakr = {}));
var MapsCreatr;
(function (MapsCreatr) {
    "use strict";
    var PreThing = (function () {
        function PreThing(thing, reference, ObjectMaker) {
            this.thing = thing;
            this.title = thing.title;
            this.reference = reference;
            this.spawned = false;
            this.left = reference.x || 0;
            this.top = reference.y || 0;
            this.right = this.left + (reference.width || ObjectMaker.getFullPropertiesOf(this.title).width);
            this.bottom = this.top + (reference.height || ObjectMaker.getFullPropertiesOf(this.title).height);
            if (reference.position) {
                this.position = reference.position;
            }
        }
        return PreThing;
    })();
    MapsCreatr.PreThing = PreThing;
})(MapsCreatr || (MapsCreatr = {}));
var MapsCreatr;
(function (MapsCreatr_1) {
    "use strict";
    var MapsCreatr = (function () {
        function MapsCreatr(settings) {
            if (!settings) {
                throw new Error("No settings object given to MapsCreatr.");
            }
            if (!settings.ObjectMaker) {
                throw new Error("No ObjectMakr given to MapsCreatr.");
            }
            if (typeof settings.ObjectMaker.getFullProperties() === "undefined") {
                throw new Error("MapsCreatr's ObjectMaker must store full properties.");
            }
            if (!settings.groupTypes) {
                throw new Error("No groupTypes given to MapsCreatr.");
            }
            this.ObjectMaker = settings.ObjectMaker;
            this.groupTypes = settings.groupTypes;
            this.keyGroupType = settings.keyGroupType || "groupType";
            this.keyEntrance = settings.keyEntrance || "entrance";
            this.macros = settings.macros || {};
            this.scope = settings.scope || this;
            this.entrances = settings.entrances;
            this.requireEntrance = settings.requireEntrance;
            this.mapsRaw = {};
            this.maps = {};
            if (settings.maps) {
                this.storeMaps(settings.maps);
            }
        }
        MapsCreatr.prototype.getObjectMaker = function () {
            return this.ObjectMaker;
        };
        MapsCreatr.prototype.getGroupTypes = function () {
            return this.groupTypes;
        };
        MapsCreatr.prototype.getKeyGroupType = function () {
            return this.keyGroupType;
        };
        MapsCreatr.prototype.getKeyEntrance = function () {
            return this.keyEntrance;
        };
        MapsCreatr.prototype.getMacros = function () {
            return this.macros;
        };
        MapsCreatr.prototype.getScope = function () {
            return this.scope;
        };
        MapsCreatr.prototype.getRequireEntrance = function () {
            return this.requireEntrance;
        };
        MapsCreatr.prototype.getMapsRaw = function () {
            return this.mapsRaw;
        };
        MapsCreatr.prototype.getMaps = function () {
            return this.maps;
        };
        MapsCreatr.prototype.getMapRaw = function (name) {
            var mapRaw = this.mapsRaw[name];
            if (!mapRaw) {
                throw new Error("No map found under: " + name);
            }
            return mapRaw;
        };
        MapsCreatr.prototype.getMap = function (name) {
            var map = this.maps[name];
            if (!map) {
                throw new Error("No map found under: " + name);
            }
            if (!map.initialized) {
                this.initializeMap(map);
            }
            return map;
        };
        MapsCreatr.prototype.storeMaps = function (maps) {
            var i;
            for (i in maps) {
                if (maps.hasOwnProperty(i)) {
                    this.storeMap(i, maps[i]);
                }
            }
        };
        MapsCreatr.prototype.storeMap = function (name, mapRaw) {
            if (!name) {
                throw new Error("Maps cannot be created with no name.");
            }
            var map = this.ObjectMaker.make("Map", mapRaw);
            this.mapsRaw[name] = mapRaw;
            if (!map.areas) {
                throw new Error("Maps cannot be used with no areas: " + name);
            }
            if (!map.locations) {
                throw new Error("Maps cannot be used with no locations: " + name);
            }
            this.maps[name] = map;
            return map;
        };
        MapsCreatr.prototype.getPreThings = function (area) {
            var map = area.map, creation = area.creation, prethings = this.createObjectFromStringArray(this.groupTypes), i;
            area.collections = {};
            for (i = 0; i < creation.length; i += 1) {
                this.analyzePreSwitch(creation[i], prethings, area, map);
            }
            return this.processPreThingsArrays(prethings);
        };
        MapsCreatr.prototype.analyzePreSwitch = function (reference, prethings, area, map) {
            if (reference.macro) {
                return this.analyzePreMacro(reference, prethings, area, map);
            }
            else {
                return this.analyzePreThing(reference, prethings, area, map);
            }
        };
        MapsCreatr.prototype.analyzePreMacro = function (reference, prethings, area, map) {
            var macro = this.macros[reference.macro], outputs, i;
            if (!macro) {
                throw new Error("A non-existent macro is referenced: '" + reference.macro + "'.");
            }
            outputs = macro(reference, prethings, area, map, this.scope);
            if (outputs) {
                if (outputs instanceof Array) {
                    for (i = 0; i < outputs.length; i += 1) {
                        this.analyzePreSwitch(outputs[i], prethings, area, map);
                    }
                }
                else {
                    this.analyzePreSwitch(outputs, prethings, area, map);
                }
            }
            return outputs;
        };
        MapsCreatr.prototype.analyzePreThing = function (reference, prethings, area, map) {
            var title = reference.thing, thing, prething;
            if (!this.ObjectMaker.hasFunction(title)) {
                throw new Error("A non-existent Thing type is referenced: '" + title + "'.");
            }
            prething = new MapsCreatr_1.PreThing(this.ObjectMaker.make(title, reference), reference, this.ObjectMaker);
            thing = prething.thing;
            if (!prething.thing[this.keyGroupType]) {
                throw new Error("A Thing of type '" + title + "' does not contain a " + this.keyGroupType + ".");
            }
            if (this.groupTypes.indexOf(prething.thing[this.keyGroupType]) === -1) {
                throw new Error("A Thing of type '" + title + "' contains an unknown " + this.keyGroupType + ".");
            }
            prethings[prething.thing[this.keyGroupType]].push(prething);
            if (!thing.noBoundaryStretch && area.boundaries) {
                this.stretchAreaBoundaries(prething, area);
            }
            if (thing[this.keyEntrance] !== undefined && typeof thing[this.keyEntrance] !== "object") {
                if (typeof map.locations[thing[this.keyEntrance]] !== "undefined") {
                    if (typeof map.locations[thing[this.keyEntrance]].xloc === "undefined") {
                        map.locations[thing[this.keyEntrance]].xloc = prething.left;
                    }
                    if (typeof map.locations[thing[this.keyEntrance]].yloc === "undefined") {
                        map.locations[thing[this.keyEntrance]].yloc = prething.top;
                    }
                    map.locations[thing[this.keyEntrance]].entrance = prething.thing;
                }
            }
            if (reference.collectionName && area.collections) {
                this.ensureThingCollection(thing, reference.collectionName, reference.collectionKey, area);
            }
            return prething;
        };
        MapsCreatr.prototype.initializeMap = function (map) {
            this.setMapAreas(map);
            this.setMapLocations(map);
            map.initialized = true;
        };
        MapsCreatr.prototype.setMapAreas = function (map) {
            var areasRaw = map.areas, locationsRaw = map.locations, areasParsed = new areasRaw.constructor(), locationsParsed = new locationsRaw.constructor(), area, location, i;
            for (i in areasRaw) {
                if (areasRaw.hasOwnProperty(i)) {
                    area = this.ObjectMaker.make("Area", areasRaw[i]);
                    areasParsed[i] = area;
                    area.map = map;
                    area.name = i;
                    area.boundaries = {
                        "top": 0,
                        "right": 0,
                        "bottom": 0,
                        "left": 0
                    };
                }
            }
            for (i in locationsRaw) {
                if (locationsRaw.hasOwnProperty(i)) {
                    location = this.ObjectMaker.make("Location", locationsRaw[i]);
                    locationsParsed[i] = location;
                    location.entryRaw = locationsRaw[i].entry;
                    location.name = i;
                    location.area = locationsRaw[i].area || 0;
                    if (this.requireEntrance) {
                        if (!this.entrances.hasOwnProperty(location.entryRaw)) {
                            throw new Error("Location " + i + " has unknown entry string: " + location.entryRaw);
                        }
                    }
                    if (this.entrances && location.entryRaw) {
                        location.entry = this.entrances[location.entryRaw];
                    }
                    else if (location.entry && location.entry.constructor === String) {
                        location.entry = this.entrances[String(location.entry)];
                    }
                }
            }
            map.areas = areasParsed;
            map.locations = locationsParsed;
        };
        MapsCreatr.prototype.setMapLocations = function (map) {
            var locationsRaw = map.locations, locationsParsed = new locationsRaw.constructor(), location, i;
            for (i in locationsRaw) {
                if (locationsRaw.hasOwnProperty(i)) {
                    location = this.ObjectMaker.make("Location", locationsRaw[i]);
                    locationsParsed[i] = location;
                    location.area = map.areas[locationsRaw[i].area || 0];
                    if (!locationsParsed[i].area) {
                        throw new Error("Location " + i + " references an invalid area:" + locationsRaw[i].area);
                    }
                }
            }
            map.locations = locationsParsed;
        };
        MapsCreatr.prototype.stretchAreaBoundaries = function (prething, area) {
            var boundaries = area.boundaries;
            boundaries.top = Math.min(prething.top, boundaries.top);
            boundaries.right = Math.max(prething.right, boundaries.right);
            boundaries.bottom = Math.max(prething.bottom, boundaries.bottom);
            boundaries.left = Math.min(prething.left, boundaries.left);
        };
        MapsCreatr.prototype.ensureThingCollection = function (thing, collectionName, collectionKey, area) {
            var collection = area.collections[collectionName];
            if (!collection) {
                collection = area.collections[collectionName] = {};
            }
            thing.collection = collection;
            collection[collectionKey] = thing;
        };
        MapsCreatr.prototype.processPreThingsArrays = function (prethings) {
            var _this = this;
            var output = {}, i;
            for (i in prethings) {
                if (prethings.hasOwnProperty(i)) {
                    var children = prethings[i], array = {
                        "xInc": this.getArraySorted(children, this.sortPreThingsXInc),
                        "xDec": this.getArraySorted(children, this.sortPreThingsXDec),
                        "yInc": this.getArraySorted(children, this.sortPreThingsYInc),
                        "yDec": this.getArraySorted(children, this.sortPreThingsYDec),
                        "push": function (prething) {
                            _this.addArraySorted(array.xInc, prething, _this.sortPreThingsXInc);
                            _this.addArraySorted(array.xDec, prething, _this.sortPreThingsXDec);
                            _this.addArraySorted(array.yInc, prething, _this.sortPreThingsYInc);
                            _this.addArraySorted(array.yDec, prething, _this.sortPreThingsYDec);
                        }
                    };
                    output[i] = array;
                }
            }
            return output;
        };
        MapsCreatr.prototype.createObjectFromStringArray = function (array) {
            var output = {}, i;
            for (i = 0; i < array.length; i += 1) {
                output[array[i]] = [];
            }
            return output;
        };
        MapsCreatr.prototype.getArraySorted = function (array, sorter) {
            var copy = array.slice();
            copy.sort(sorter);
            return copy;
        };
        MapsCreatr.prototype.addArraySorted = function (array, element, sorter) {
            var lower = 0, upper = array.length, index;
            while (lower !== upper) {
                index = ((lower + upper) / 2) | 0;
                if (sorter(element, array[index]) < 0) {
                    upper = index;
                }
                else {
                    lower = index + 1;
                }
            }
            if (lower === upper) {
                array.splice(lower, 0, element);
                return;
            }
        };
        MapsCreatr.prototype.sortPreThingsXInc = function (a, b) {
            return a.left === b.left ? a.top - b.top : a.left - b.left;
        };
        MapsCreatr.prototype.sortPreThingsXDec = function (a, b) {
            return b.right === a.right ? b.bottom - a.bottom : b.right - a.right;
        };
        MapsCreatr.prototype.sortPreThingsYInc = function (a, b) {
            return a.top === b.top ? a.left - b.left : a.top - b.top;
        };
        MapsCreatr.prototype.sortPreThingsYDec = function (a, b) {
            return b.bottom === a.bottom ? b.right - a.right : b.bottom - a.bottom;
        };
        return MapsCreatr;
    })();
    MapsCreatr_1.MapsCreatr = MapsCreatr;
})(MapsCreatr || (MapsCreatr = {}));
var MapScreenr;
(function (MapScreenr_1) {
    "use strict";
    var MapScreenr = (function () {
        function MapScreenr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to MapScreenr.");
            }
            if (typeof settings.width === "undefined") {
                throw new Error("No width given to MapScreenr.");
            }
            if (typeof settings.height === "undefined") {
                throw new Error("No height given to MapScreenr.");
            }
            var name;
            for (name in settings) {
                if (settings.hasOwnProperty(name)) {
                    this[name] = settings[name];
                }
            }
            this.variables = settings.variables || {};
            this.variableArgs = settings.variableArgs || [];
        }
        MapScreenr.prototype.clearScreen = function () {
            this.left = 0;
            this.top = 0;
            this.right = this.width;
            this.bottom = this.height;
            this.setMiddleX();
            this.setMiddleY();
            this.setVariables();
        };
        MapScreenr.prototype.setMiddleX = function () {
            this.middleX = (this.left + this.right) / 2;
        };
        MapScreenr.prototype.setMiddleY = function () {
            this.middleY = (this.top + this.bottom) / 2;
        };
        MapScreenr.prototype.setVariables = function () {
            var i;
            for (i in this.variables) {
                if (this.variables.hasOwnProperty(i)) {
                    this.setVariable(i);
                }
            }
        };
        MapScreenr.prototype.setVariable = function (name, value) {
            this[name] = arguments.length === 1
                ? this.variables[name].apply(this, this.variableArgs)
                : value;
        };
        MapScreenr.prototype.shift = function (dx, dy) {
            if (dx) {
                this.shiftX(dx);
            }
            if (dy) {
                this.shiftY(dy);
            }
        };
        MapScreenr.prototype.shiftX = function (dx) {
            this.left += dx;
            this.right += dx;
        };
        MapScreenr.prototype.shiftY = function (dy) {
            this.top += dy;
            this.bottom += dy;
        };
        return MapScreenr;
    })();
    MapScreenr_1.MapScreenr = MapScreenr;
})(MapScreenr || (MapScreenr = {}));
var AreaSpawnr;
(function (AreaSpawnr_1) {
    "use strict";
    var AreaSpawnr = (function () {
        function AreaSpawnr(settings) {
            if (!settings) {
                throw new Error("No settings given to AreaSpawnr.");
            }
            if (!settings.MapsCreator) {
                throw new Error("No MapsCreator provided to AreaSpawnr.");
            }
            this.MapsCreator = settings.MapsCreator;
            if (!settings.MapScreener) {
                throw new Error("No MapScreener provided to AreaSpawnr.");
            }
            this.MapScreener = settings.MapScreener;
            this.onSpawn = settings.onSpawn;
            this.onUnspawn = settings.onUnspawn;
            this.screenAttributes = settings.screenAttributes || [];
            this.stretchAdd = settings.stretchAdd;
            this.afterAdd = settings.afterAdd;
            this.commandScope = settings.commandScope;
        }
        AreaSpawnr.prototype.getMapsCreator = function () {
            return this.MapsCreator;
        };
        AreaSpawnr.prototype.getMapScreener = function () {
            return this.MapScreener;
        };
        AreaSpawnr.prototype.getScreenAttributes = function () {
            return this.screenAttributes;
        };
        AreaSpawnr.prototype.getMapName = function () {
            return this.mapName;
        };
        AreaSpawnr.prototype.getMap = function (name) {
            if (typeof name !== "undefined") {
                return this.MapsCreator.getMap(name);
            }
            else {
                return this.mapCurrent;
            }
        };
        AreaSpawnr.prototype.getMaps = function () {
            return this.MapsCreator.getMaps();
        };
        AreaSpawnr.prototype.getArea = function () {
            return this.areaCurrent;
        };
        AreaSpawnr.prototype.getAreaName = function () {
            return this.areaCurrent.name;
        };
        AreaSpawnr.prototype.getLocation = function (location) {
            return this.areaCurrent.map.locations[location];
        };
        AreaSpawnr.prototype.getLocationEntered = function () {
            return this.locationEntered;
        };
        AreaSpawnr.prototype.getPreThings = function () {
            return this.prethings;
        };
        AreaSpawnr.prototype.setMap = function (name, location) {
            this.mapCurrent = this.getMap(name);
            if (!this.mapCurrent) {
                throw new Error("Unknown Map in setMap: '" + name + "'.");
            }
            this.mapName = name;
            if (arguments.length > 1) {
                this.setLocation(location);
            }
            return this.mapCurrent;
        };
        AreaSpawnr.prototype.setLocation = function (name) {
            var location, attribute, i;
            location = this.mapCurrent.locations[name];
            if (!location) {
                throw new Error("Unknown location in setLocation: '" + name + "'.");
            }
            this.locationEntered = location;
            this.areaCurrent = location.area;
            this.areaCurrent.boundaries = {
                "top": 0,
                "right": 0,
                "bottom": 0,
                "left": 0
            };
            for (i = 0; i < this.screenAttributes.length; i += 1) {
                attribute = this.screenAttributes[i];
                this.MapScreener[attribute] = this.areaCurrent[attribute];
            }
            this.prethings = this.MapsCreator.getPreThings(location.area);
            if (this.areaCurrent.stretches) {
                this.setStretches(this.areaCurrent.stretches);
            }
            if (this.areaCurrent.afters) {
                this.setAfters(this.areaCurrent.afters);
            }
        };
        AreaSpawnr.prototype.setStretches = function (stretchesRaw) {
            var i;
            this.stretches = stretchesRaw;
            for (i = 0; i < stretchesRaw.length; i += 1) {
                this.stretchAdd.call(this.commandScope || this, stretchesRaw[i], i, stretchesRaw);
            }
        };
        AreaSpawnr.prototype.setAfters = function (aftersRaw) {
            var i;
            this.afters = aftersRaw;
            for (i = 0; i < aftersRaw.length; i += 1) {
                this.afterAdd.call(this.commandScope || this, aftersRaw[i], i, aftersRaw);
            }
        };
        AreaSpawnr.prototype.spawnArea = function (direction, top, right, bottom, left) {
            if (this.onSpawn) {
                this.applySpawnAction(this.onSpawn, true, direction, top, right, bottom, left);
            }
        };
        AreaSpawnr.prototype.unspawnArea = function (direction, top, right, bottom, left) {
            if (this.onUnspawn) {
                this.applySpawnAction(this.onUnspawn, false, direction, top, right, bottom, left);
            }
        };
        AreaSpawnr.prototype.applySpawnAction = function (callback, status, direction, top, right, bottom, left) {
            var name, group, prething, mid, start, end, i;
            for (name in this.prethings) {
                if (!this.prethings.hasOwnProperty(name)) {
                    continue;
                }
                group = this.prethings[name][direction];
                if (group.length === 0) {
                    continue;
                }
                mid = (group.length / 2) | 0;
                start = this.findPreThingsSpawnStart(direction, group, mid, top, right, bottom, left);
                end = this.findPreThingsSpawnEnd(direction, group, mid, top, right, bottom, left);
                for (i = start; i <= end; i += 1) {
                    prething = group[i];
                    if (prething.spawned !== status) {
                        prething.spawned = status;
                        callback(prething);
                    }
                }
            }
        };
        AreaSpawnr.prototype.findPreThingsSpawnStart = function (direction, group, mid, top, right, bottom, left) {
            var directionKey = AreaSpawnr.directionKeys[direction], directionEnd = this.getDirectionEnd(directionKey, top, right, bottom, left), i;
            for (i = 0; i < group.length; i += 1) {
                if (group[i][directionKey] >= directionEnd) {
                    return i;
                }
            }
            return i;
        };
        AreaSpawnr.prototype.findPreThingsSpawnEnd = function (direction, group, mid, top, right, bottom, left) {
            var directionKey = AreaSpawnr.directionKeys[direction], directionKeyOpposite = AreaSpawnr.directionKeys[AreaSpawnr.directionOpposites[direction]], directionEnd = this.getDirectionEnd(directionKeyOpposite, top, right, bottom, left), i;
            for (i = group.length - 1; i >= 0; i -= 1) {
                if (group[i][directionKey] <= directionEnd) {
                    return i;
                }
            }
            return i;
        };
        AreaSpawnr.prototype.getDirectionEnd = function (directionKey, top, right, bottom, left) {
            switch (directionKey) {
                case "top":
                    return top;
                case "right":
                    return right;
                case "bottom":
                    return bottom;
                case "left":
                    return left;
                default:
                    throw new Error("Unknown directionKey: " + directionKey);
            }
        };
        AreaSpawnr.directionKeys = {
            "xInc": "left",
            "xDec": "right",
            "yInc": "top",
            "yDec": "bottom"
        };
        AreaSpawnr.directionOpposites = {
            "xInc": "xDec",
            "xDec": "xInc",
            "yInc": "yDec",
            "yDec": "yInc"
        };
        return AreaSpawnr;
    })();
    AreaSpawnr_1.AreaSpawnr = AreaSpawnr;
})(AreaSpawnr || (AreaSpawnr = {}));
var ItemsHoldr;
(function (ItemsHoldr_1) {
    "use strict";
    var ItemValue = (function () {
        function ItemValue(ItemsHolder, key, settings) {
            if (settings === void 0) { settings = {}; }
            this.ItemsHolder = ItemsHolder;
            ItemsHolder.proliferate(this, ItemsHolder.getDefaults());
            ItemsHolder.proliferate(this, settings);
            this.key = key;
            if (!this.hasOwnProperty("value")) {
                this.value = this.valueDefault;
            }
            if (this.hasElement) {
                this.element = ItemsHolder.createElement(this.elementTag || "div", {
                    className: ItemsHolder.getPrefix() + "_value " + key
                });
                this.element.appendChild(ItemsHolder.createElement("div", {
                    "textContent": key
                }));
                this.element.appendChild(ItemsHolder.createElement("div", {
                    "textContent": this.value
                }));
            }
            if (this.storeLocally) {
                if (ItemsHolder.getLocalStorage().hasOwnProperty(ItemsHolder.getPrefix() + key)) {
                    this.value = this.retrieveLocalStorage();
                    this.update();
                }
                else {
                    this.updateLocalStorage();
                }
            }
        }
        ItemValue.prototype.getValue = function () {
            if (this.transformGet) {
                return this.transformGet(this.value);
            }
            return this.value;
        };
        ItemValue.prototype.setValue = function (value) {
            if (this.transformSet) {
                this.value = this.transformSet(value);
            }
            else {
                this.value = value;
            }
            this.update();
        };
        ItemValue.prototype.update = function () {
            if (this.hasOwnProperty("minimum") && Number(this.value) <= Number(this.minimum)) {
                this.value = this.minimum;
                if (this.onMinimum) {
                    this.onMinimum.apply(this, this.ItemsHolder.getCallbackArgs());
                }
            }
            else if (this.hasOwnProperty("maximum") && Number(this.value) <= Number(this.maximum)) {
                this.value = this.maximum;
                if (this.onMaximum) {
                    this.onMaximum.apply(this, this.ItemsHolder.getCallbackArgs());
                }
            }
            if (this.modularity) {
                this.checkModularity();
            }
            if (this.triggers) {
                this.checkTriggers();
            }
            if (this.hasElement) {
                this.updateElement();
            }
            if (this.storeLocally) {
                this.updateLocalStorage();
            }
        };
        ItemValue.prototype.updateLocalStorage = function (overrideAutoSave) {
            if (overrideAutoSave || this.ItemsHolder.getAutoSave()) {
                this.ItemsHolder.getLocalStorage()[this.ItemsHolder.getPrefix() + this.key] = JSON.stringify(this.value);
            }
        };
        ItemValue.prototype.checkTriggers = function () {
            if (this.triggers.hasOwnProperty(this.value)) {
                this.triggers[this.value].apply(this, this.ItemsHolder.getCallbackArgs());
            }
        };
        ItemValue.prototype.checkModularity = function () {
            if (this.value.constructor !== Number || !this.modularity) {
                return;
            }
            while (this.value >= this.modularity) {
                this.value = Math.max(0, this.value - this.modularity);
                if (this.onModular) {
                    this.onModular.apply(this, this.ItemsHolder.getCallbackArgs());
                }
            }
        };
        ItemValue.prototype.updateElement = function () {
            if (this.ItemsHolder.hasDisplayChange(this.value)) {
                this.element.children[1].textContent = this.ItemsHolder.getDisplayChange(this.value);
            }
            else {
                this.element.children[1].textContent = this.value;
            }
        };
        ItemValue.prototype.retrieveLocalStorage = function () {
            var value = localStorage.getItem(this.ItemsHolder.getPrefix() + this.key);
            if (value === "undefined") {
                return undefined;
            }
            if (value.constructor !== String) {
                return value;
            }
            return JSON.parse(value);
        };
        return ItemValue;
    })();
    ItemsHoldr_1.ItemValue = ItemValue;
    var ItemsHoldr = (function () {
        function ItemsHoldr(settings) {
            if (settings === void 0) { settings = {}; }
            var key;
            this.prefix = settings.prefix || "";
            this.autoSave = settings.autoSave;
            this.callbackArgs = settings.callbackArgs || [];
            this.allowNewItems = settings.allowNewItems === undefined
                ? true : settings.allowNewItems;
            if (settings.localStorage) {
                this.localStorage = settings.localStorage;
            }
            else if (typeof localStorage === "undefined") {
                this.localStorage = this.createPlaceholderStorage();
            }
            else {
                this.localStorage = localStorage;
            }
            this.defaults = settings.defaults || {};
            this.displayChanges = settings.displayChanges || {};
            this.items = {};
            if (settings.values) {
                this.itemKeys = Object.keys(settings.values);
                for (key in settings.values) {
                    if (settings.values.hasOwnProperty(key)) {
                        this.addItem(key, settings.values[key]);
                    }
                }
            }
            else {
                this.itemKeys = [];
            }
            if (settings.doMakeContainer) {
                this.containersArguments = settings.containersArguments || [
                    ["div", {
                            "className": this.prefix + "_container"
                        }]
                ];
                this.container = this.makeContainer(settings.containersArguments);
            }
        }
        ItemsHoldr.prototype.key = function (index) {
            return this.itemKeys[index];
        };
        ItemsHoldr.prototype.getValues = function () {
            return this.items;
        };
        ItemsHoldr.prototype.getDefaults = function () {
            return this.defaults;
        };
        ItemsHoldr.prototype.getLocalStorage = function () {
            return this.localStorage;
        };
        ItemsHoldr.prototype.getAutoSave = function () {
            return this.autoSave;
        };
        ItemsHoldr.prototype.getPrefix = function () {
            return this.prefix;
        };
        ItemsHoldr.prototype.getContainer = function () {
            return this.container;
        };
        ItemsHoldr.prototype.getContainersArguments = function () {
            return this.containersArguments;
        };
        ItemsHoldr.prototype.getDisplayChanges = function () {
            return this.displayChanges;
        };
        ItemsHoldr.prototype.getCallbackArgs = function () {
            return this.callbackArgs;
        };
        ItemsHoldr.prototype.getKeys = function () {
            return Object.keys(this.items);
        };
        ItemsHoldr.prototype.getItem = function (key) {
            this.checkExistence(key);
            return this.items[key].getValue();
        };
        ItemsHoldr.prototype.getObject = function (key) {
            return this.items[key];
        };
        ItemsHoldr.prototype.hasKey = function (key) {
            return this.items.hasOwnProperty(key);
        };
        ItemsHoldr.prototype.exportItems = function () {
            var output = {}, i;
            for (i in this.items) {
                if (this.items.hasOwnProperty(i)) {
                    output[i] = this.items[i].getValue();
                }
            }
            return output;
        };
        ItemsHoldr.prototype.addItem = function (key, settings) {
            if (settings === void 0) { settings = {}; }
            this.items[key] = new ItemValue(this, key, settings);
            this.itemKeys.push(key);
            return this.items[key];
        };
        ItemsHoldr.prototype.removeItem = function (key) {
            if (!this.items.hasOwnProperty(key)) {
                return;
            }
            if (this.container && this.items[key].hasElement) {
                this.container.removeChild(this.items[key].element);
            }
            this.itemKeys.splice(this.itemKeys.indexOf(key), 1);
            delete this.items[key];
        };
        ItemsHoldr.prototype.clear = function () {
            var i;
            if (this.container) {
                for (i in this.items) {
                    if (this.items[i].hasElement) {
                        this.container.removeChild(this.items[i].element);
                    }
                }
            }
            this.items = {};
            this.itemKeys = [];
        };
        ItemsHoldr.prototype.setItem = function (key, value) {
            this.checkExistence(key);
            this.items[key].setValue(value);
        };
        ItemsHoldr.prototype.increase = function (key, amount) {
            if (amount === void 0) { amount = 1; }
            this.checkExistence(key);
            var value = this.items[key].getValue();
            value += amount;
            this.items[key].setValue(value);
        };
        ItemsHoldr.prototype.decrease = function (key, amount) {
            if (amount === void 0) { amount = 1; }
            this.checkExistence(key);
            var value = this.items[key].getValue();
            value -= amount;
            this.items[key].setValue(value);
        };
        ItemsHoldr.prototype.toggle = function (key) {
            this.checkExistence(key);
            var value = this.items[key].getValue();
            value = value ? false : true;
            this.items[key].setValue(value);
        };
        ItemsHoldr.prototype.checkExistence = function (key) {
            if (!this.items.hasOwnProperty(key)) {
                if (this.allowNewItems) {
                    this.addItem(key);
                }
                else {
                    throw new Error("Unknown key given to ItemsHoldr: '" + key + "'.");
                }
            }
        };
        ItemsHoldr.prototype.saveItem = function (key) {
            if (!this.items.hasOwnProperty(key)) {
                throw new Error("Unknown key given to ItemsHoldr: '" + key + "'.");
            }
            this.items[key].updateLocalStorage(true);
        };
        ItemsHoldr.prototype.saveAll = function () {
            var key;
            for (key in this.items) {
                if (this.items.hasOwnProperty(key)) {
                    this.items[key].updateLocalStorage(true);
                }
            }
        };
        ItemsHoldr.prototype.hideContainer = function () {
            this.container.style.visibility = "hidden";
        };
        ItemsHoldr.prototype.displayContainer = function () {
            this.container.style.visibility = "visible";
        };
        ItemsHoldr.prototype.makeContainer = function (containers) {
            var output = this.createElement.apply(this, containers[0]), current = output, child, key, i;
            for (i = 1; i < containers.length; ++i) {
                child = this.createElement.apply(this, containers[i]);
                current.appendChild(child);
                current = child;
            }
            for (key in this.items) {
                if (this.items[key].hasElement) {
                    child.appendChild(this.items[key].element);
                }
            }
            return output;
        };
        ItemsHoldr.prototype.hasDisplayChange = function (value) {
            return this.displayChanges.hasOwnProperty(value);
        };
        ItemsHoldr.prototype.getDisplayChange = function (value) {
            return this.displayChanges[value];
        };
        ItemsHoldr.prototype.createElement = function (tag) {
            if (tag === void 0) { tag = "div"; }
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var element = document.createElement(tag), i;
            for (i = 0; i < args.length; i += 1) {
                this.proliferateElement(element, args[i]);
            }
            return element;
        };
        ItemsHoldr.prototype.proliferate = function (recipient, donor, noOverride) {
            var setting, i;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient.hasOwnProperty(i)) {
                        continue;
                    }
                    setting = donor[i];
                    if (typeof setting === "object") {
                        if (!recipient.hasOwnProperty(i)) {
                            recipient[i] = new setting.constructor();
                        }
                        this.proliferate(recipient[i], setting, noOverride);
                    }
                    else {
                        recipient[i] = setting;
                    }
                }
            }
            return recipient;
        };
        ItemsHoldr.prototype.proliferateElement = function (recipient, donor, noOverride) {
            var setting, i, j;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient.hasOwnProperty(i)) {
                        continue;
                    }
                    setting = donor[i];
                    switch (i) {
                        case "children":
                            if (typeof (setting) !== "undefined") {
                                for (j = 0; j < setting.length; j += 1) {
                                    recipient.appendChild(setting[j]);
                                }
                            }
                            break;
                        case "style":
                            this.proliferate(recipient[i], setting);
                            break;
                        default:
                            if (typeof setting === "object") {
                                if (!recipient.hasOwnProperty(i)) {
                                    recipient[i] = new setting.constructor();
                                }
                                this.proliferate(recipient[i], setting, noOverride);
                            }
                            else {
                                recipient[i] = setting;
                            }
                            break;
                    }
                }
            }
            return recipient;
        };
        ItemsHoldr.prototype.createPlaceholderStorage = function () {
            var i, output = {
                "keys": [],
                "getItem": function (key) {
                    return this.localStorage[key];
                },
                "setItem": function (key, value) {
                    this.localStorage[key] = value;
                },
                "clear": function () {
                    for (i in this) {
                        if (this.hasOwnProperty(i)) {
                            delete this[i];
                        }
                    }
                },
                "removeItem": function (key) {
                    delete this[key];
                },
                "key": function (index) {
                    return this.keys[index];
                }
            };
            Object.defineProperties(output, {
                "length": {
                    "get": function () {
                        return output.keys.length;
                    }
                },
                "remainingSpace": {
                    "get": function () {
                        return 9001;
                    }
                }
            });
            return output;
        };
        return ItemsHoldr;
    })();
    ItemsHoldr_1.ItemsHoldr = ItemsHoldr;
})(ItemsHoldr || (ItemsHoldr = {}));
var AudioPlayr;
(function (AudioPlayr_1) {
    "use strict";
    var AudioPlayr = (function () {
        function AudioPlayr(settings) {
            if (typeof settings.library === "undefined") {
                throw new Error("No library given to AudioPlayr.");
            }
            if (typeof settings.directory === "undefined") {
                throw new Error("No directory given to AudioPlayr.");
            }
            if (typeof settings.fileTypes === "undefined") {
                throw new Error("No fileTypes given to AudioPlayr.");
            }
            if (!settings.ItemsHolder) {
                throw new Error("No ItemsHoldr given to AudioPlayr.");
            }
            var volumeInitial;
            this.ItemsHolder = settings.ItemsHolder;
            this.directory = settings.directory;
            this.fileTypes = settings.fileTypes;
            this.getThemeDefault = settings.getThemeDefault || "Theme";
            this.getVolumeLocal = typeof settings.getVolumeLocal === "undefined"
                ? 1 : settings.getVolumeLocal;
            this.sounds = {};
            this.generateLibraryFromSettings(settings.library);
            volumeInitial = this.ItemsHolder.getItem("volume");
            if (volumeInitial === undefined) {
                this.setVolume(1);
            }
            else {
                this.setVolume(volumeInitial);
            }
            this.setMuted(this.ItemsHolder.getItem("muted") || false);
        }
        AudioPlayr.prototype.getLibrary = function () {
            return this.library;
        };
        AudioPlayr.prototype.getFileTypes = function () {
            return this.fileTypes;
        };
        AudioPlayr.prototype.getSounds = function () {
            return this.sounds;
        };
        AudioPlayr.prototype.getTheme = function () {
            return this.theme;
        };
        AudioPlayr.prototype.getThemeName = function () {
            return this.themeName;
        };
        AudioPlayr.prototype.getDirectory = function () {
            return this.directory;
        };
        AudioPlayr.prototype.getVolume = function () {
            return Number(this.ItemsHolder.getItem("volume") || 0);
        };
        AudioPlayr.prototype.setVolume = function (volume) {
            var i;
            if (!this.getMuted()) {
                for (i in this.sounds) {
                    if (this.sounds.hasOwnProperty(i)) {
                        this.sounds[i].volume = Number(this.sounds[i].getAttribute("volumeReal")) * volume;
                    }
                }
            }
            this.ItemsHolder.setItem("volume", volume.toString());
        };
        AudioPlayr.prototype.getMuted = function () {
            return Boolean(Number(this.ItemsHolder.getItem("muted")));
        };
        AudioPlayr.prototype.setMuted = function (muted) {
            this.getMuted() ? this.setMutedOn() : this.setMutedOff();
        };
        AudioPlayr.prototype.toggleMuted = function () {
            this.setMuted(!this.getMuted());
        };
        AudioPlayr.prototype.setMutedOn = function () {
            var i;
            for (i in this.sounds) {
                if (this.sounds.hasOwnProperty(i)) {
                    this.sounds[i].volume = 0;
                }
            }
            this.ItemsHolder.setItem("muted", "1");
        };
        AudioPlayr.prototype.setMutedOff = function () {
            var volume = this.getVolume(), sound, i;
            for (i in this.sounds) {
                if (this.sounds.hasOwnProperty(i)) {
                    sound = this.sounds[i];
                    sound.volume = Number(sound.getAttribute("volumeReal")) * volume;
                }
            }
            this.ItemsHolder.setItem("muted", "0");
        };
        AudioPlayr.prototype.getGetVolumeLocal = function () {
            return this.getVolumeLocal;
        };
        AudioPlayr.prototype.setGetVolumeLocal = function (getVolumeLocalNew) {
            this.getVolumeLocal = getVolumeLocalNew;
        };
        AudioPlayr.prototype.getGetThemeDefault = function () {
            return this.getThemeDefault;
        };
        AudioPlayr.prototype.setGetThemeDefault = function (getThemeDefaultNew) {
            this.getThemeDefault = getThemeDefaultNew;
        };
        AudioPlayr.prototype.play = function (name) {
            var sound, used;
            if (!this.sounds.hasOwnProperty(name)) {
                if (!this.library.hasOwnProperty(name)) {
                    throw new Error("Unknown name given to AudioPlayr.play: '" + name + "'.");
                }
                sound = this.sounds[name] = this.library[name];
            }
            else {
                sound = this.sounds[name];
            }
            this.soundStop(sound);
            if (this.getMuted()) {
                sound.volume = 0;
            }
            else {
                sound.setAttribute("volumeReal", "1");
                sound.volume = this.getVolume();
            }
            this.playSound(sound);
            used = Number(sound.getAttribute("used"));
            if (!used) {
                sound.setAttribute("used", String(used + 1));
                sound.addEventListener("ended", this.soundFinish.bind(this, name));
            }
            sound.setAttribute("name", name);
            return sound;
        };
        AudioPlayr.prototype.pauseAll = function () {
            var i;
            for (i in this.sounds) {
                if (this.sounds.hasOwnProperty(i)) {
                    this.pauseSound(this.sounds[i]);
                }
            }
        };
        AudioPlayr.prototype.resumeAll = function () {
            var i;
            for (i in this.sounds) {
                if (!this.sounds.hasOwnProperty(i)) {
                    continue;
                }
                this.playSound(this.sounds[i]);
            }
        };
        AudioPlayr.prototype.pauseTheme = function () {
            if (this.theme) {
                this.pauseSound(this.theme);
            }
        };
        AudioPlayr.prototype.resumeTheme = function () {
            if (this.theme) {
                this.playSound(this.theme);
            }
        };
        AudioPlayr.prototype.clearAll = function () {
            this.pauseAll();
            this.clearTheme();
            this.sounds = {};
        };
        AudioPlayr.prototype.clearTheme = function () {
            if (!this.theme) {
                return;
            }
            this.pauseTheme();
            delete this.sounds[this.theme.getAttribute("name")];
            this.theme = undefined;
            this.themeName = undefined;
        };
        AudioPlayr.prototype.playLocal = function (name, location) {
            var sound = this.play(name), volumeReal;
            switch (this.getVolumeLocal.constructor) {
                case Function:
                    volumeReal = this.getVolumeLocal(location);
                    break;
                case Number:
                    volumeReal = this.getVolumeLocal;
                    break;
                default:
                    volumeReal = Number(this.getVolumeLocal) || 1;
                    break;
            }
            sound.setAttribute("volumeReal", String(volumeReal));
            if (this.getMuted()) {
                sound.volume = 0;
            }
            else {
                sound.volume = volumeReal * this.getVolume();
            }
            return sound;
        };
        AudioPlayr.prototype.playTheme = function (name, loop) {
            this.pauseTheme();
            loop = typeof loop !== "undefined" ? loop : true;
            if (typeof name === "undefined") {
                switch (this.getThemeDefault.constructor) {
                    case Function:
                        name = this.getThemeDefault();
                        break;
                    default:
                        name = this.getThemeDefault;
                        break;
                }
            }
            if (typeof this.theme !== "undefined" && this.theme.hasAttribute("name")) {
                delete this.sounds[this.theme.getAttribute("name")];
            }
            this.themeName = name;
            this.theme = this.sounds[name] = this.play(name);
            this.theme.loop = loop;
            if (this.theme.getAttribute("used") === "1") {
                this.theme.addEventListener("ended", this.playTheme.bind(this));
            }
            return this.theme;
        };
        AudioPlayr.prototype.playThemePrefixed = function (prefix, name, loop) {
            var sound = this.play(prefix);
            this.pauseTheme();
            if (typeof name === "undefined") {
                switch (this.getThemeDefault.constructor) {
                    case Function:
                        name = this.getThemeDefault();
                        break;
                    default:
                        name = this.getThemeDefault;
                        break;
                }
            }
            this.addEventListener(prefix, "ended", this.playTheme.bind(this, prefix + " " + name, loop));
            return sound;
        };
        AudioPlayr.prototype.addEventListener = function (name, event, callback) {
            var sound = this.library[name];
            if (!sound) {
                throw new Error("Unknown name given to addEventListener: '" + name + "'.");
            }
            if (!sound.addedEvents) {
                sound.addedEvents = {};
            }
            if (!sound.addedEvents[event]) {
                sound.addedEvents[event] = [callback];
            }
            else {
                sound.addedEvents[event].push(callback);
            }
            sound.addEventListener(event, callback);
        };
        AudioPlayr.prototype.removeEventListeners = function (name, event) {
            var sound = this.library[name], events, i;
            if (!sound) {
                throw new Error("Unknown name given to removeEventListeners: '" + name + "'.");
            }
            if (!sound.addedEvents) {
                return;
            }
            events = sound.addedEvents[event];
            if (!events) {
                return;
            }
            for (i = 0; i < events.length; i += 1) {
                sound.removeEventListener(event, events[i]);
            }
            events.length = 0;
        };
        AudioPlayr.prototype.addEventImmediate = function (name, event, callback) {
            if (!this.sounds.hasOwnProperty(name) || this.sounds[name].paused) {
                callback();
                return;
            }
            this.sounds[name].addEventListener(event, callback);
        };
        AudioPlayr.prototype.soundFinish = function (name) {
            if (this.sounds.hasOwnProperty(name)) {
                delete this.sounds[name];
            }
        };
        AudioPlayr.prototype.soundStop = function (sound) {
            this.pauseSound(sound);
            if (sound.readyState) {
                sound.currentTime = 0;
            }
        };
        AudioPlayr.prototype.generateLibraryFromSettings = function (librarySettings) {
            var directory = {}, directorySoundNames, directoryName, name, j;
            this.library = {};
            this.directories = {};
            for (directoryName in librarySettings) {
                if (!librarySettings.hasOwnProperty(directoryName)) {
                    continue;
                }
                directory = {};
                directorySoundNames = librarySettings[directoryName];
                for (j = 0; j < directorySoundNames.length; j += 1) {
                    name = directorySoundNames[j];
                    this.library[name] = directory[name] = this.createAudio(name, directoryName);
                }
                this.directories[directoryName] = directory;
            }
        };
        AudioPlayr.prototype.createAudio = function (name, directory) {
            var sound = document.createElement("audio"), sourceType, child, i;
            for (i = 0; i < this.fileTypes.length; i += 1) {
                sourceType = this.fileTypes[i];
                child = document.createElement("source");
                child.type = "audio/" + sourceType;
                child.src = this.directory + "/" + directory + "/" + sourceType + "/" + name + "." + sourceType;
                sound.appendChild(child);
            }
            sound.volume = 0;
            sound.setAttribute("volumeReal", "1");
            sound.setAttribute("used", "0");
            this.playSound(sound);
            return sound;
        };
        AudioPlayr.prototype.playSound = function (sound) {
            if (sound && sound.play) {
                sound.play();
                return true;
            }
            return false;
        };
        AudioPlayr.prototype.pauseSound = function (sound) {
            if (sound && sound.pause) {
                sound.pause();
                return true;
            }
            return false;
        };
        return AudioPlayr;
    })();
    AudioPlayr_1.AudioPlayr = AudioPlayr;
})(AudioPlayr || (AudioPlayr = {}));
var ChangeLinr;
(function (ChangeLinr_1) {
    "use strict";
    var ChangeLinr = (function () {
        function ChangeLinr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to ChangeLinr.");
            }
            if (typeof settings.pipeline === "undefined") {
                throw new Error("No pipeline given to ChangeLinr.");
            }
            if (typeof settings.transforms === "undefined") {
                throw new Error("No transforms given to ChangeLinr.");
            }
            var i;
            this.pipeline = settings.pipeline || [];
            this.transforms = settings.transforms || {};
            this.doMakeCache = typeof settings.doMakeCache === "undefined"
                ? true : settings.doMakeCache;
            this.doUseCache = typeof settings.doUseCache === "undefined"
                ? true : settings.doUseCache;
            this.cache = {};
            this.cacheFull = {};
            for (i = 0; i < this.pipeline.length; i += 1) {
                if (!this.pipeline[i]) {
                    throw new Error("Pipe[" + i + "] is invalid.");
                }
                if (!this.transforms.hasOwnProperty(this.pipeline[i])) {
                    throw new Error("Pipe[" + i + "] ('" + this.pipeline[i] + "') not found in transforms.");
                }
                if (!(this.transforms[this.pipeline[i]] instanceof Function)) {
                    throw new Error("Pipe[" + i + "] ('" + this.pipeline[i] + "') is not a valid Function from transforms.");
                }
                this.cacheFull[i] = this.cacheFull[this.pipeline[i]] = {};
            }
        }
        ChangeLinr.prototype.getCache = function () {
            return this.cache;
        };
        ChangeLinr.prototype.getCached = function (key) {
            return this.cache[key];
        };
        ChangeLinr.prototype.getCacheFull = function () {
            return this.cacheFull;
        };
        ChangeLinr.prototype.getDoMakeCache = function () {
            return this.doMakeCache;
        };
        ChangeLinr.prototype.getDoUseCache = function () {
            return this.doUseCache;
        };
        ChangeLinr.prototype.process = function (data, key, attributes) {
            var i;
            if (typeof key === "undefined" && (this.doMakeCache || this.doUseCache)) {
                key = data;
            }
            if (this.doUseCache && this.cache.hasOwnProperty(key)) {
                return this.cache[key];
            }
            for (i = 0; i < this.pipeline.length; i += 1) {
                data = this.transforms[this.pipeline[i]](data, key, attributes, this);
                if (this.doMakeCache) {
                    this.cacheFull[this.pipeline[i]][key] = data;
                }
            }
            if (this.doMakeCache) {
                this.cache[key] = data;
            }
            return data;
        };
        ChangeLinr.prototype.processFull = function (data, key, attributes) {
            var output = {}, i;
            this.process(data, key, attributes);
            for (i = 0; i < this.pipeline.length; i += 1) {
                output[i] = output[this.pipeline[i]] = this.cacheFull[this.pipeline[i]][key];
            }
            return output;
        };
        return ChangeLinr;
    })();
    ChangeLinr_1.ChangeLinr = ChangeLinr;
})(ChangeLinr || (ChangeLinr = {}));
var InputWritr;
(function (InputWritr_1) {
    "use strict";
    var InputWritr = (function () {
        function InputWritr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to InputWritr.");
            }
            if (typeof settings.triggers === "undefined") {
                throw new Error("No triggers given to InputWritr.");
            }
            this.triggers = settings.triggers;
            if (typeof settings.getTimestamp === "undefined") {
                if (typeof performance === "undefined") {
                    this.getTimestamp = function () {
                        return Date.now();
                    };
                }
                else {
                    this.getTimestamp = (performance.now
                        || performance.webkitNow
                        || performance.mozNow
                        || performance.msNow
                        || performance.oNow).bind(performance);
                }
            }
            else {
                this.getTimestamp = settings.getTimestamp;
            }
            this.eventInformation = settings.eventInformation;
            this.canTrigger = settings.hasOwnProperty("canTrigger")
                ? settings.canTrigger
                : function () {
                    return true;
                };
            this.isRecording = settings.hasOwnProperty("isRecording")
                ? settings.isRecording
                : function () {
                    return true;
                };
            this.currentHistory = {};
            this.histories = {};
            this.aliases = {};
            this.addAliases(settings.aliases || {});
            this.keyAliasesToCodes = settings.keyAliasesToCodes || {
                "shift": 16,
                "ctrl": 17,
                "space": 32,
                "left": 37,
                "up": 38,
                "right": 39,
                "down": 40
            };
            this.keyCodesToAliases = settings.keyCodesToAliases || {
                "16": "shift",
                "17": "ctrl",
                "32": "space",
                "37": "left",
                "38": "up",
                "39": "right",
                "40": "down"
            };
        }
        InputWritr.prototype.getAliases = function () {
            return this.aliases;
        };
        InputWritr.prototype.getAliasesAsKeyStrings = function () {
            var output = {}, alias;
            for (alias in this.aliases) {
                if (this.aliases.hasOwnProperty(alias)) {
                    output[alias] = this.getAliasAsKeyStrings(alias);
                }
            }
            return output;
        };
        InputWritr.prototype.getAliasAsKeyStrings = function (alias) {
            return this.aliases[alias].map(this.convertAliasToKeyString.bind(this));
        };
        InputWritr.prototype.convertAliasToKeyString = function (alias) {
            if (alias.constructor === String) {
                return alias;
            }
            if (alias > 96 && alias < 105) {
                return String.fromCharCode(alias - 48);
            }
            if (alias > 64 && alias < 97) {
                return String.fromCharCode(alias);
            }
            return typeof this.keyCodesToAliases[alias] !== "undefined"
                ? this.keyCodesToAliases[alias]
                : "?";
        };
        InputWritr.prototype.convertKeyStringToAlias = function (key) {
            if (key.constructor === Number) {
                return key;
            }
            if (key.length === 1) {
                return key.charCodeAt(0) - 32;
            }
            return typeof this.keyAliasesToCodes[key] !== "undefined"
                ? this.keyAliasesToCodes[key]
                : -1;
        };
        InputWritr.prototype.getCurrentHistory = function () {
            return this.currentHistory;
        };
        InputWritr.prototype.getHistory = function (name) {
            return this.histories[name];
        };
        InputWritr.prototype.getHistories = function () {
            return this.histories;
        };
        InputWritr.prototype.getCanTrigger = function () {
            return this.canTrigger;
        };
        InputWritr.prototype.getIsRecording = function () {
            return this.isRecording;
        };
        InputWritr.prototype.setCanTrigger = function (canTriggerNew) {
            if (canTriggerNew.constructor === Boolean) {
                this.canTrigger = function () {
                    return canTriggerNew;
                };
            }
            else {
                this.canTrigger = canTriggerNew;
            }
        };
        InputWritr.prototype.setIsRecording = function (isRecordingNew) {
            if (isRecordingNew.constructor === Boolean) {
                this.isRecording = function () {
                    return isRecordingNew;
                };
            }
            else {
                this.isRecording = isRecordingNew;
            }
        };
        InputWritr.prototype.setEventInformation = function (eventInformationNew) {
            this.eventInformation = eventInformationNew;
        };
        InputWritr.prototype.addAliasValues = function (name, values) {
            var triggerName, triggerGroup, i;
            if (!this.aliases.hasOwnProperty(name)) {
                this.aliases[name] = values;
            }
            else {
                this.aliases[name].push.apply(this.aliases[name], values);
            }
            for (triggerName in this.triggers) {
                if (this.triggers.hasOwnProperty(triggerName)) {
                    triggerGroup = this.triggers[triggerName];
                    if (triggerGroup.hasOwnProperty(name)) {
                        for (i = 0; i < values.length; i += 1) {
                            triggerGroup[values[i]] = triggerGroup[name];
                        }
                    }
                }
            }
        };
        InputWritr.prototype.removeAliasValues = function (name, values) {
            var triggerName, triggerGroup, i;
            if (!this.aliases.hasOwnProperty(name)) {
                return;
            }
            for (i = 0; i < values.length; i += 1) {
                this.aliases[name].splice(this.aliases[name].indexOf(values[i], 1));
            }
            for (triggerName in this.triggers) {
                if (this.triggers.hasOwnProperty(triggerName)) {
                    triggerGroup = this.triggers[triggerName];
                    if (triggerGroup.hasOwnProperty(name)) {
                        for (i = 0; i < values.length; i += 1) {
                            if (triggerGroup.hasOwnProperty(values[i])) {
                                delete triggerGroup[values[i]];
                            }
                        }
                    }
                }
            }
        };
        InputWritr.prototype.switchAliasValues = function (name, valuesOld, valuesNew) {
            this.removeAliasValues(name, valuesOld);
            this.addAliasValues(name, valuesNew);
        };
        InputWritr.prototype.addAliases = function (aliasesRaw) {
            var aliasName;
            for (aliasName in aliasesRaw) {
                if (aliasesRaw.hasOwnProperty(aliasName)) {
                    this.addAliasValues(aliasName, aliasesRaw[aliasName]);
                }
            }
        };
        InputWritr.prototype.addEvent = function (trigger, label, callback) {
            var i;
            if (!this.triggers.hasOwnProperty(trigger)) {
                throw new Error("Unknown trigger requested: '" + trigger + "'.");
            }
            this.triggers[trigger][label] = callback;
            if (this.aliases.hasOwnProperty(label)) {
                for (i = 0; i < this.aliases[label].length; i += 1) {
                    this.triggers[trigger][this.aliases[label][i]] = callback;
                }
            }
        };
        InputWritr.prototype.removeEvent = function (trigger, label) {
            var i;
            if (!this.triggers.hasOwnProperty(trigger)) {
                throw new Error("Unknown trigger requested: '" + trigger + "'.");
            }
            delete this.triggers[trigger][label];
            if (this.aliases.hasOwnProperty(label)) {
                for (i = 0; i < this.aliases[label].length; i += 1) {
                    if (this.triggers[trigger][this.aliases[label][i]]) {
                        delete this.triggers[trigger][this.aliases[label][i]];
                    }
                }
            }
        };
        InputWritr.prototype.saveHistory = function (name) {
            if (name === void 0) { name = Object.keys(this.histories).length.toString(); }
            this.histories[name] = this.currentHistory;
        };
        InputWritr.prototype.restartHistory = function (keepHistory) {
            if (keepHistory === void 0) { keepHistory = true; }
            if (keepHistory) {
                this.saveHistory();
            }
            this.currentHistory = {};
            this.startingTime = this.getTimestamp();
        };
        InputWritr.prototype.playHistory = function (history) {
            var time;
            for (time in history) {
                if (history.hasOwnProperty(time)) {
                    setTimeout(this.makeEventCall(history[time]), (Number(time) - this.startingTime) | 0);
                }
            }
        };
        InputWritr.prototype.callEvent = function (event, keyCode, sourceEvent) {
            if (!event) {
                throw new Error("Blank event given to InputWritr.");
            }
            if (!this.canTrigger(event, keyCode, sourceEvent)) {
                return;
            }
            if (event.constructor === String) {
                event = this.triggers[event][keyCode];
            }
            return event(this.eventInformation, sourceEvent);
        };
        InputWritr.prototype.makePipe = function (trigger, codeLabel, preventDefaults) {
            var _this = this;
            var functions = this.triggers[trigger];
            if (!functions) {
                throw new Error("No trigger of label '" + trigger + "' defined.");
            }
            return function (event) {
                var alias = event[codeLabel];
                if (preventDefaults && event.preventDefault instanceof Function) {
                    event.preventDefault();
                }
                if (functions.hasOwnProperty(alias)) {
                    if (_this.isRecording()) {
                        _this.saveEventInformation([trigger, alias]);
                    }
                    _this.callEvent(functions[alias], alias, event);
                }
            };
        };
        InputWritr.prototype.makeEventCall = function (info) {
            var _this = this;
            return function () {
                _this.callEvent(info[0], info[1]);
                if (_this.isRecording()) {
                    _this.saveEventInformation(info);
                }
            };
        };
        InputWritr.prototype.saveEventInformation = function (info) {
            this.currentHistory[this.getTimestamp() | 0] = info;
        };
        return InputWritr;
    })();
    InputWritr_1.InputWritr = InputWritr;
})(InputWritr || (InputWritr = {}));
var DeviceLayr;
(function (DeviceLayr_1) {
    "use strict";
    (function (AxisStatus) {
        AxisStatus[AxisStatus["negative"] = 0] = "negative";
        AxisStatus[AxisStatus["neutral"] = 1] = "neutral";
        AxisStatus[AxisStatus["positive"] = 2] = "positive";
    })(DeviceLayr_1.AxisStatus || (DeviceLayr_1.AxisStatus = {}));
    var AxisStatus = DeviceLayr_1.AxisStatus;
    var DeviceLayr = (function () {
        function DeviceLayr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to DeviceLayr.");
            }
            if (typeof settings.InputWriter === "undefined") {
                throw new Error("No InputWriter given to DeviceLayr.");
            }
            this.InputWritr = settings.InputWriter;
            this.triggers = settings.triggers || {};
            this.aliases = settings.aliases || {
                "on": "on",
                "off": "off"
            };
            this.gamepads = [];
        }
        DeviceLayr.prototype.getInputWritr = function () {
            return this.InputWritr;
        };
        DeviceLayr.prototype.getTriggers = function () {
            return this.triggers;
        };
        DeviceLayr.prototype.getAliases = function () {
            return this.aliases;
        };
        DeviceLayr.prototype.getGamepads = function () {
            return this.gamepads;
        };
        DeviceLayr.prototype.checkNavigatorGamepads = function () {
            if (typeof navigator.getGamepads === "undefined" || !navigator.getGamepads()[this.gamepads.length]) {
                return 0;
            }
            this.registerGamepad(navigator.getGamepads()[this.gamepads.length]);
            return this.checkNavigatorGamepads() + 1;
        };
        DeviceLayr.prototype.registerGamepad = function (gamepad) {
            this.gamepads.push(gamepad);
            this.setDefaultTriggerStatuses(gamepad, this.triggers);
        };
        DeviceLayr.prototype.activateAllGamepadTriggers = function () {
            for (var i = 0; i < this.gamepads.length; i += 1) {
                this.activateGamepadTriggers(this.gamepads[i]);
            }
        };
        DeviceLayr.prototype.activateGamepadTriggers = function (gamepad) {
            var mapping = DeviceLayr.controllerMappings[gamepad.mapping || "standard"], i;
            for (i = Math.min(mapping.axes.length, gamepad.axes.length) - 1; i >= 0; i -= 1) {
                this.activateAxisTrigger(gamepad, mapping.axes[i].name, mapping.axes[i].axis, gamepad.axes[i]);
            }
            for (i = Math.min(mapping.buttons.length, gamepad.buttons.length) - 1; i >= 0; i -= 1) {
                this.activateButtonTrigger(gamepad, mapping.buttons[i], gamepad.buttons[i].pressed);
            }
        };
        DeviceLayr.prototype.activateAxisTrigger = function (gamepad, name, axis, magnitude) {
            var listing = this.triggers[name][axis], status;
            if (!listing) {
                return;
            }
            status = this.getAxisStatus(gamepad, magnitude);
            if (listing.status === status) {
                return false;
            }
            if (listing.status !== undefined && listing[AxisStatus[listing.status]] !== undefined) {
                this.InputWritr.callEvent(this.aliases.off, listing[AxisStatus[listing.status]]);
            }
            listing.status = status;
            if (listing[AxisStatus[status]] !== undefined) {
                this.InputWritr.callEvent(this.aliases.on, listing[AxisStatus[status]]);
            }
            return true;
        };
        DeviceLayr.prototype.activateButtonTrigger = function (gamepad, name, status) {
            var listing = this.triggers[name];
            if (!listing || listing.status === status) {
                return false;
            }
            listing.status = status;
            this.InputWritr.callEvent(status ? this.aliases.on : this.aliases.off, listing.trigger);
            return true;
        };
        DeviceLayr.prototype.clearAllGamepadTriggers = function () {
            for (var i = 0; i < this.gamepads.length; i += 1) {
                this.clearGamepadTriggers(this.gamepads[i]);
            }
        };
        DeviceLayr.prototype.clearGamepadTriggers = function (gamepad) {
            var mapping = DeviceLayr.controllerMappings[gamepad.mapping || "standard"], i;
            for (i = 0; i < mapping.axes.length; i += 1) {
                this.clearAxisTrigger(gamepad, mapping.axes[i].name, mapping.axes[i].axis);
            }
            for (i = 0; i < mapping.buttons.length; i += 1) {
                this.clearButtonTrigger(gamepad, mapping.buttons[i]);
            }
        };
        DeviceLayr.prototype.clearAxisTrigger = function (gamepad, name, axis) {
            var listing = this.triggers[name][axis];
            listing.status = AxisStatus.neutral;
        };
        DeviceLayr.prototype.clearButtonTrigger = function (gamepad, name) {
            var listing = this.triggers[name];
            listing.status = false;
        };
        DeviceLayr.prototype.setDefaultTriggerStatuses = function (gamepad, triggers) {
            var mapping = DeviceLayr.controllerMappings[gamepad.mapping || "standard"], button, joystick, i, j;
            for (i = 0; i < mapping.buttons.length; i += 1) {
                button = triggers[mapping.buttons[i]];
                if (button && button.status === undefined) {
                    button.status = false;
                }
            }
            for (i = 0; i < mapping.axes.length; i += 1) {
                joystick = triggers[mapping.axes[i].name];
                for (j in joystick) {
                    if (!joystick.hasOwnProperty(j)) {
                        continue;
                    }
                    if (joystick[j].status === undefined) {
                        joystick[j].status = AxisStatus.neutral;
                    }
                }
            }
        };
        DeviceLayr.prototype.getAxisStatus = function (gamepad, magnitude) {
            var joystickThreshold = DeviceLayr.controllerMappings[gamepad.mapping || "standard"].joystickThreshold;
            if (magnitude > joystickThreshold) {
                return AxisStatus.positive;
            }
            if (magnitude < -joystickThreshold) {
                return AxisStatus.negative;
            }
            return AxisStatus.neutral;
        };
        DeviceLayr.controllerMappings = {
            "standard": {
                "axes": [
                    {
                        "axis": "x",
                        "joystick": 0,
                        "name": "leftJoystick"
                    },
                    {
                        "axis": "y",
                        "joystick": 0,
                        "name": "leftJoystick"
                    },
                    {
                        "axis": "x",
                        "joystick": 1,
                        "name": "rightJoystick"
                    },
                    {
                        "axis": "y",
                        "joystick": 1,
                        "name": "rightJoystick"
                    }
                ],
                "buttons": [
                    "a",
                    "b",
                    "x",
                    "y",
                    "leftTop",
                    "rightTop",
                    "leftTrigger",
                    "rightTrigger",
                    "select",
                    "start",
                    "leftStick",
                    "rightStick",
                    "dpadUp",
                    "dpadDown",
                    "dpadLeft",
                    "dpadRight"
                ],
                "joystickThreshold": .49
            }
        };
        return DeviceLayr;
    })();
    DeviceLayr_1.DeviceLayr = DeviceLayr;
})(DeviceLayr || (DeviceLayr = {}));
var EightBittr;
(function (EightBittr_1) {
    "use strict";
    var EightBittr = (function () {
        function EightBittr(customs) {
            if (customs === void 0) { customs = {}; }
            var EightBitter = EightBittr.prototype.ensureCorrectCaller(this), constants = customs.constants, constantsSource = customs.constantsSource || EightBitter, i;
            EightBitter.unitsize = customs.unitsize || 1;
            EightBitter.constants = constants;
            if (constants) {
                for (i = 0; i < constants.length; i += 1) {
                    EightBitter[constants[i]] = constantsSource[constants[i]];
                }
            }
        }
        EightBittr.prototype.reset = function (EightBitter, resets, customs) {
            var reset, i;
            EightBitter.customs = customs;
            for (i = 0; i < resets.length; i += 1) {
                reset = resets[i];
                if (!EightBitter[reset]) {
                    throw new Error(reset + " is missing on a resetting EightBittr.");
                }
                EightBitter[reset](EightBitter, customs);
            }
        };
        EightBittr.prototype.resetTimed = function (EightBitter, resets, customs) {
            var timeStartTotal = performance.now(), timeEndTotal, timeStart, timeEnd, i;
            this.resetTimes = {
                order: resets,
                times: []
            };
            for (i = 0; i < resets.length; i += 1) {
                timeStart = performance.now();
                EightBitter[resets[i]](EightBitter, customs);
                timeEnd = performance.now();
                this.resetTimes.times.push({
                    "name": resets[i],
                    "timeStart": timeStart,
                    "timeEnd": timeEnd,
                    "timeTaken": timeEnd - timeStart
                });
            }
            timeEndTotal = performance.now();
            this.resetTimes.total = {
                "name": "resetTimed",
                "timeStart": timeStartTotal,
                "timeEnd": timeEndTotal,
                "timeTaken": timeEndTotal - timeStartTotal
            };
        };
        EightBittr.prototype.createCanvas = function (width, height) {
            var canvas = document.createElement("canvas"), context = canvas.getContext("2d");
            canvas.width = width;
            canvas.height = height;
            if (typeof context.imageSmoothingEnabled !== "undefined") {
                context.imageSmoothingEnabled = false;
            }
            else if (typeof context.webkitImageSmoothingEnabled !== "undefined") {
                context.webkitImageSmoothingEnabled = false;
            }
            else if (typeof context.mozImageSmoothingEnabled !== "undefined") {
                context.mozImageSmoothingEnabled = false;
            }
            else if (typeof context.msImageSmoothingEnabled !== "undefined") {
                context.msImageSmoothingEnabled = false;
            }
            else if (typeof context.oImageSmoothingEnabled !== "undefined") {
                context.oImageSmoothingEnabled = false;
            }
            return canvas;
        };
        EightBittr.prototype.shiftVert = function (thing, dy) {
            thing.top += dy;
            thing.bottom += dy;
        };
        EightBittr.prototype.shiftHoriz = function (thing, dx) {
            thing.left += dx;
            thing.right += dx;
        };
        EightBittr.prototype.setTop = function (thing, top) {
            thing.top = top;
            thing.bottom = thing.top + thing.height * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.setRight = function (thing, right) {
            thing.right = right;
            thing.left = thing.right - thing.width * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.setBottom = function (thing, bottom) {
            thing.bottom = bottom;
            thing.top = thing.bottom - thing.height * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.setLeft = function (thing, left) {
            thing.left = left;
            thing.right = thing.left + thing.width * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.setMidX = function (thing, x) {
            thing.EightBitter.setLeft(thing, x - thing.width * thing.EightBitter.unitsize / 2);
        };
        EightBittr.prototype.setMidY = function (thing, y) {
            thing.EightBitter.setTop(thing, y - thing.height * thing.EightBitter.unitsize / 2);
        };
        EightBittr.prototype.setMid = function (thing, x, y) {
            thing.EightBitter.setMidX(thing, x);
            thing.EightBitter.setMidY(thing, y);
        };
        EightBittr.prototype.getMidX = function (thing) {
            return thing.left + thing.width * thing.EightBitter.unitsize / 2;
        };
        EightBittr.prototype.getMidY = function (thing) {
            return thing.top + thing.height * thing.EightBitter.unitsize / 2;
        };
        EightBittr.prototype.setMidObj = function (thing, other) {
            thing.EightBitter.setMidXObj(thing, other);
            thing.EightBitter.setMidYObj(thing, other);
        };
        EightBittr.prototype.setMidXObj = function (thing, other) {
            thing.EightBitter.setLeft(thing, thing.EightBitter.getMidX(other)
                - (thing.width * thing.EightBitter.unitsize / 2));
        };
        EightBittr.prototype.setMidYObj = function (thing, other) {
            thing.EightBitter.setTop(thing, thing.EightBitter.getMidY(other)
                - (thing.height * thing.EightBitter.unitsize / 2));
        };
        EightBittr.prototype.objectToLeft = function (thing, other) {
            return (thing.EightBitter.getMidX(thing) < thing.EightBitter.getMidX(other));
        };
        EightBittr.prototype.updateTop = function (thing, dy) {
            thing.top += dy || 0;
            thing.bottom = thing.top + thing.height * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.updateRight = function (thing, dx) {
            thing.right += dx || 0;
            thing.left = thing.right - thing.width * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.updateBottom = function (thing, dy) {
            thing.bottom += dy || 0;
            thing.top = thing.bottom - thing.height * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.updateLeft = function (thing, dx) {
            thing.left += dx || 0;
            thing.right = thing.left + thing.width * thing.EightBitter.unitsize;
        };
        EightBittr.prototype.slideToX = function (thing, x, maxDistance) {
            var midx = thing.EightBitter.getMidX(thing);
            maxDistance = maxDistance || Infinity;
            if (midx < x) {
                thing.EightBitter.shiftHoriz(thing, Math.min(maxDistance, x - midx));
            }
            else {
                thing.EightBitter.shiftHoriz(thing, Math.max(-maxDistance, x - midx));
            }
        };
        EightBittr.prototype.slideToY = function (thing, y, maxDistance) {
            var midy = thing.EightBitter.getMidY(thing);
            maxDistance = maxDistance || Infinity;
            if (midy < y) {
                thing.EightBitter.shiftVert(thing, Math.min(maxDistance, y - midy));
            }
            else {
                thing.EightBitter.shiftVert(thing, Math.max(-maxDistance, y - midy));
            }
        };
        EightBittr.prototype.ensureCorrectCaller = function (current) {
            if (!(current instanceof EightBittr)) {
                throw new Error("A function requires the caller ('this') to be the "
                    + "manipulated EightBittr object. Unfortunately, 'this' is a "
                    + typeof (this) + ".");
            }
            return current;
        };
        EightBittr.prototype.proliferate = function (recipient, donor, noOverride) {
            if (noOverride === void 0) { noOverride = false; }
            var setting, i;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient.hasOwnProperty(i)) {
                        continue;
                    }
                    setting = donor[i];
                    if (typeof setting === "object") {
                        if (!recipient.hasOwnProperty(i)) {
                            recipient[i] = new setting.constructor();
                        }
                        this.proliferate(recipient[i], setting, noOverride);
                    }
                    else {
                        recipient[i] = setting;
                    }
                }
            }
            return recipient;
        };
        EightBittr.prototype.proliferateHard = function (recipient, donor, noOverride) {
            var setting, i;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient[i]) {
                        continue;
                    }
                    setting = donor[i];
                    if (typeof setting === "object") {
                        if (!recipient[i]) {
                            recipient[i] = new setting.constructor();
                        }
                        this.proliferate(recipient[i], setting, noOverride);
                    }
                    else {
                        recipient[i] = setting;
                    }
                }
            }
            return recipient;
        };
        EightBittr.prototype.proliferateElement = function (recipient, donor, noOverride) {
            if (noOverride === void 0) { noOverride = false; }
            var setting, i, j;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient.hasOwnProperty(i)) {
                        continue;
                    }
                    setting = donor[i];
                    switch (i) {
                        case "children":
                        case "children":
                            if (typeof (setting) !== "undefined") {
                                for (j = 0; j < setting.length; j += 1) {
                                    recipient.appendChild(setting[j]);
                                }
                            }
                            break;
                        case "style":
                            this.proliferate(recipient[i], setting);
                            break;
                        default:
                            if (setting === null) {
                                recipient[i] = null;
                            }
                            else if (typeof setting === "object") {
                                if (!recipient.hasOwnProperty(i)) {
                                    recipient[i] = new setting.constructor();
                                }
                                this.proliferate(recipient[i], setting, noOverride);
                            }
                            else {
                                recipient[i] = setting;
                            }
                            break;
                    }
                }
            }
            return recipient;
        };
        EightBittr.prototype.createElement = function (tag) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var EightBitter = EightBittr.prototype.ensureCorrectCaller(this), element = document.createElement(tag || "div"), i;
            for (i = 0; i < args.length; i += 1) {
                EightBitter.proliferateElement(element, args[i]);
            }
            return element;
        };
        EightBittr.prototype.followPathHard = function (object, path, index) {
            if (index === void 0) { index = 0; }
            for (var i = index; i < path.length; i += 1) {
                if (typeof object[path[i]] === "undefined") {
                    return undefined;
                }
                else {
                    object = object[path[i]];
                }
            }
            return object;
        };
        EightBittr.prototype.arraySwitch = function (object, arrayOld, arrayNew) {
            arrayOld.splice(arrayOld.indexOf(object), 1);
            arrayNew.push(object);
        };
        EightBittr.prototype.arrayToBeginning = function (object, array) {
            array.splice(array.indexOf(object), 1);
            array.unshift(object);
        };
        EightBittr.prototype.arrayToEnd = function (object, array) {
            array.splice(array.indexOf(object), 1);
            array.push(object);
        };
        EightBittr.prototype.arrayToIndex = function (object, array, index) {
            array.splice(array.indexOf(object), 1);
            array.splice(index, 0, object);
        };
        return EightBittr;
    })();
    EightBittr_1.EightBittr = EightBittr;
    ;
})(EightBittr || (EightBittr = {}));
var FPSAnalyzr;
(function (FPSAnalyzr_1) {
    "use strict";
    var FPSAnalyzr = (function () {
        function FPSAnalyzr(settings) {
            if (settings === void 0) { settings = {}; }
            this.maxKept = settings.maxKept || 35;
            this.numRecorded = 0;
            this.ticker = -1;
            this.measurements = isFinite(this.maxKept) ? new Array(this.maxKept) : {};
            if (typeof settings.getTimestamp === "undefined") {
                if (typeof performance === "undefined") {
                    this.getTimestamp = function () {
                        return Date.now();
                    };
                }
                else {
                    this.getTimestamp = (performance.now
                        || performance.webkitNow
                        || performance.mozNow
                        || performance.msNow
                        || performance.oNow).bind(performance);
                }
            }
            else {
                this.getTimestamp = settings.getTimestamp;
            }
        }
        FPSAnalyzr.prototype.measure = function (time) {
            if (time === void 0) { time = this.getTimestamp(); }
            if (this.timeCurrent) {
                this.addFPS(1000 / (time - this.timeCurrent));
            }
            this.timeCurrent = time;
        };
        FPSAnalyzr.prototype.addFPS = function (fps) {
            this.ticker = (this.ticker += 1) % this.maxKept;
            this.measurements[this.ticker] = fps;
            this.numRecorded += 1;
        };
        FPSAnalyzr.prototype.getMaxKept = function () {
            return this.maxKept;
        };
        FPSAnalyzr.prototype.getNumRecorded = function () {
            return this.numRecorded;
        };
        FPSAnalyzr.prototype.getTimeCurrent = function () {
            return this.timeCurrent;
        };
        FPSAnalyzr.prototype.getTicker = function () {
            return this.ticker;
        };
        FPSAnalyzr.prototype.getMeasurements = function () {
            var fpsKeptReal = Math.min(this.maxKept, this.numRecorded), copy, i;
            if (isFinite(this.maxKept)) {
                copy = new Array(fpsKeptReal);
            }
            else {
                copy = {};
                copy.length = fpsKeptReal;
            }
            for (i = fpsKeptReal - 1; i >= 0; --i) {
                copy[i] = this.measurements[i];
            }
            return copy;
        };
        FPSAnalyzr.prototype.getDifferences = function () {
            var copy = this.getMeasurements(), i;
            for (i = copy.length - 1; i >= 0; --i) {
                copy[i] = 1000 / copy[i];
            }
            return copy;
        };
        FPSAnalyzr.prototype.getAverage = function () {
            var total = 0, max = Math.min(this.maxKept, this.numRecorded), i;
            for (i = max - 1; i >= 0; --i) {
                total += this.measurements[i];
            }
            return total / max;
        };
        FPSAnalyzr.prototype.getMedian = function () {
            var copy = this.getMeasurementsSorted(), fpsKeptReal = copy.length, fpsKeptHalf = Math.floor(fpsKeptReal / 2);
            if (copy.length % 2 === 0) {
                return copy[fpsKeptHalf];
            }
            else {
                return (copy[fpsKeptHalf - 2] + copy[fpsKeptHalf]) / 2;
            }
        };
        FPSAnalyzr.prototype.getExtremes = function () {
            var lowest = this.measurements[0], highest = lowest, max = Math.min(this.maxKept, this.numRecorded), fps, i;
            for (i = max - 1; i >= 0; --i) {
                fps = this.measurements[i];
                if (fps > highest) {
                    highest = fps;
                }
                else if (fps < lowest) {
                    lowest = fps;
                }
            }
            return [lowest, highest];
        };
        FPSAnalyzr.prototype.getRange = function () {
            var extremes = this.getExtremes();
            return extremes[1] - extremes[0];
        };
        FPSAnalyzr.prototype.getMeasurementsSorted = function () {
            var copy, i;
            if (this.measurements.constructor === Array) {
                copy = [].slice.call(this.measurements).sort();
            }
            else {
                copy = [];
                for (i in this.measurements) {
                    if (this.measurements.hasOwnProperty(i)) {
                        if (typeof this.measurements[i] !== "undefined") {
                            copy[i] = this.measurements[i];
                        }
                    }
                }
                copy.sort();
            }
            if (this.numRecorded < this.maxKept) {
                copy.length = this.numRecorded;
            }
            return copy.sort();
        };
        return FPSAnalyzr;
    })();
    FPSAnalyzr_1.FPSAnalyzr = FPSAnalyzr;
})(FPSAnalyzr || (FPSAnalyzr = {}));
var GamesRunnr;
(function (GamesRunnr_1) {
    "use strict";
    var GamesRunnr = (function () {
        function GamesRunnr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given GamesRunnr.");
            }
            if (typeof settings.games === "undefined") {
                throw new Error("No games given to GamesRunnr.");
            }
            var i;
            this.games = settings.games;
            this.interval = settings.interval || 1000 / 60;
            this.speed = settings.speed || 1;
            this.onPause = settings.onPause;
            this.onPlay = settings.onPlay;
            this.callbackArguments = settings.callbackArguments || [this];
            this.adjustFramerate = settings.adjustFramerate;
            this.FPSAnalyzer = settings.FPSAnalyzer || new FPSAnalyzr.FPSAnalyzr(settings.FPSAnalyzerSettings);
            this.scope = settings.scope || this;
            this.paused = true;
            this.upkeepScheduler = settings.upkeepScheduler || function (handler, timeout) {
                return setTimeout(handler, timeout);
            };
            this.upkeepCanceller = settings.upkeepCanceller || function (handle) {
                clearTimeout(handle);
            };
            this.upkeepBound = this.upkeep.bind(this);
            for (i = 0; i < this.games.length; i += 1) {
                this.games[i] = this.games[i].bind(this.scope);
            }
            this.setIntervalReal();
        }
        GamesRunnr.prototype.getFPSAnalyzer = function () {
            return this.FPSAnalyzer;
        };
        GamesRunnr.prototype.getPaused = function () {
            return this.paused;
        };
        GamesRunnr.prototype.getGames = function () {
            return this.games;
        };
        GamesRunnr.prototype.getInterval = function () {
            return this.interval;
        };
        GamesRunnr.prototype.getSpeed = function () {
            return this.speed;
        };
        GamesRunnr.prototype.getOnPause = function () {
            return this.onPause;
        };
        GamesRunnr.prototype.getOnPlay = function () {
            return this.onPlay;
        };
        GamesRunnr.prototype.getCallbackArguments = function () {
            return this.callbackArguments;
        };
        GamesRunnr.prototype.getUpkeepScheduler = function () {
            return this.upkeepScheduler;
        };
        GamesRunnr.prototype.getUpkeepCanceller = function () {
            return this.upkeepCanceller;
        };
        GamesRunnr.prototype.upkeep = function () {
            if (this.paused) {
                return;
            }
            this.upkeepCanceller(this.upkeepNext);
            if (this.adjustFramerate) {
                this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal - (this.upkeepTimed() | 0));
            }
            else {
                this.upkeepNext = this.upkeepScheduler(this.upkeepBound, this.intervalReal);
                this.runAllGames();
            }
            if (this.FPSAnalyzer) {
                this.FPSAnalyzer.measure();
            }
        };
        GamesRunnr.prototype.upkeepTimed = function () {
            if (!this.FPSAnalyzer) {
                throw new Error("An internal FPSAnalyzr is required for upkeepTimed.");
            }
            var now = this.FPSAnalyzer.getTimestamp();
            this.runAllGames();
            return this.FPSAnalyzer.getTimestamp() - now;
        };
        GamesRunnr.prototype.play = function () {
            if (!this.paused) {
                return;
            }
            this.paused = false;
            if (this.onPlay) {
                this.onPlay.apply(this, this.callbackArguments);
            }
            this.upkeep();
        };
        GamesRunnr.prototype.pause = function () {
            if (this.paused) {
                return;
            }
            this.paused = true;
            if (this.onPause) {
                this.onPause.apply(this, this.callbackArguments);
            }
            this.upkeepCanceller(this.upkeepNext);
        };
        GamesRunnr.prototype.step = function (times) {
            if (times === void 0) { times = 1; }
            this.play();
            this.pause();
            if (times > 0) {
                this.step(times - 1);
            }
        };
        GamesRunnr.prototype.togglePause = function () {
            this.paused ? this.play() : this.pause();
        };
        GamesRunnr.prototype.setInterval = function (interval) {
            var intervalReal = Number(interval);
            if (isNaN(intervalReal)) {
                throw new Error("Invalid interval given to setInterval: " + interval);
            }
            this.interval = intervalReal;
            this.setIntervalReal();
        };
        GamesRunnr.prototype.setSpeed = function (speed) {
            var speedReal = Number(speed);
            if (isNaN(speedReal)) {
                throw new Error("Invalid speed given to setSpeed: " + speed);
            }
            this.speed = speedReal;
            this.setIntervalReal();
        };
        GamesRunnr.prototype.setIntervalReal = function () {
            this.intervalReal = (1 / this.speed) * this.interval;
        };
        GamesRunnr.prototype.runAllGames = function () {
            for (var i = 0; i < this.games.length; i += 1) {
                this.games[i]();
            }
        };
        return GamesRunnr;
    })();
    GamesRunnr_1.GamesRunnr = GamesRunnr;
})(GamesRunnr || (GamesRunnr = {}));
var GroupHoldr;
(function (GroupHoldr_1) {
    "use strict";
    var GroupHoldr = (function () {
        function GroupHoldr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to GroupHoldr.");
            }
            if (typeof settings.groupNames === "undefined") {
                throw new Error("No groupNames given to GroupHoldr.");
            }
            if (typeof settings.groupTypes === "undefined") {
                throw new Error("No groupTypes given to GroupHoldr.");
            }
            this.functions = {
                "setGroup": {},
                "getGroup": {},
                "set": {},
                "get": {},
                "add": {},
                "delete": {}
            };
            this.setGroupNames(settings.groupNames, settings.groupTypes);
        }
        GroupHoldr.prototype.getFunctions = function () {
            return this.functions;
        };
        GroupHoldr.prototype.getGroups = function () {
            return this.groups;
        };
        GroupHoldr.prototype.getGroup = function (name) {
            return this.groups[name];
        };
        GroupHoldr.prototype.getGroupNames = function () {
            return this.groupNames;
        };
        GroupHoldr.prototype.switchMemberGroup = function (value, groupNameOld, groupNameNew, keyOld, keyNew) {
            var groupOld = this.groups[groupNameOld];
            if (groupOld.constructor === Array) {
                this.functions.delete[groupNameOld](value, keyOld);
            }
            else {
                this.functions.delete[groupNameOld](keyOld);
            }
            this.functions.add[groupNameNew](value, keyNew);
        };
        GroupHoldr.prototype.applyAll = function (scope, func, args) {
            if (args === void 0) { args = undefined; }
            var i;
            if (!args) {
                args = [undefined];
            }
            else {
                args.unshift(undefined);
            }
            if (!scope) {
                scope = this;
            }
            for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
                args[0] = this.groups[this.groupNames[i]];
                func.apply(scope, args);
            }
            args.shift();
        };
        GroupHoldr.prototype.applyOnAll = function (scope, func, args) {
            if (args === void 0) { args = undefined; }
            var group, i, j;
            if (!args) {
                args = [undefined];
            }
            else {
                args.unshift(undefined);
            }
            if (!scope) {
                scope = this;
            }
            for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
                group = this.groups[this.groupNames[i]];
                if (group instanceof Array) {
                    for (j = 0; j < group.length; j += 1) {
                        args[0] = group[j];
                        func.apply(scope, args);
                    }
                }
                else {
                    for (j in group) {
                        if (group.hasOwnProperty(j)) {
                            args[0] = group[j];
                            func.apply(scope, args);
                        }
                    }
                }
            }
        };
        GroupHoldr.prototype.callAll = function (scope, func) {
            var args = Array.prototype.slice.call(arguments, 1), i;
            if (!scope) {
                scope = this;
            }
            for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
                args[0] = this.groups[this.groupNames[i]];
                func.apply(scope, args);
            }
        };
        GroupHoldr.prototype.callOnAll = function (scope, func) {
            var args = Array.prototype.slice.call(arguments, 1), group, i, j;
            if (!scope) {
                scope = this;
            }
            for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
                group = this.groups[this.groupNames[i]];
                if (group instanceof Array) {
                    for (j = 0; j < group.length; j += 1) {
                        args[0] = group[j];
                        func.apply(scope, args);
                    }
                }
                else {
                    for (j in group) {
                        if (group.hasOwnProperty(j)) {
                            args[0] = group[j];
                            func.apply(scope, args);
                        }
                    }
                }
            }
        };
        GroupHoldr.prototype.clearArrays = function () {
            var group, i;
            for (i = this.groupNames.length - 1; i >= 0; i -= 1) {
                group = this.groups[this.groupNames[i]];
                if (group instanceof Array) {
                    group.length = 0;
                }
            }
        };
        GroupHoldr.prototype.setGroupNames = function (names, types) {
            var scope = this, typeFunc, typeName;
            if (this.groupNames) {
                this.clearFunctions();
            }
            this.groupNames = names;
            this.groupTypes = {};
            this.groupTypeNames = {};
            if (types.constructor === Object) {
                this.groupNames.forEach(function (name) {
                    scope.groupTypes[name] = scope.getTypeFunction(types[name]);
                    scope.groupTypeNames[name] = scope.getTypeName(types[name]);
                });
            }
            else {
                typeFunc = this.getTypeFunction(types);
                typeName = this.getTypeName(types);
                this.groupNames.forEach(function (name) {
                    scope.groupTypes[name] = typeFunc;
                    scope.groupTypeNames[name] = typeName;
                });
            }
            this.setGroups();
            this.createFunctions();
        };
        GroupHoldr.prototype.clearFunctions = function () {
            this.groupNames.forEach(function (name) {
                delete this["set" + name + "Group"];
                delete this["get" + name + "Group"];
                delete this["set" + name];
                delete this["get" + name];
                delete this["add" + name];
                delete this["delete" + name];
                this.functions.setGroup = {};
                this.functions.getGroup = {};
                this.functions.set = {};
                this.functions.get = {};
                this.functions.add = {};
                this.functions.delete = {};
            });
        };
        GroupHoldr.prototype.setGroups = function () {
            var scope = this;
            this.groups = {};
            this.groupNames.forEach(function (name) {
                scope.groups[name] = new scope.groupTypes[name]();
            });
        };
        GroupHoldr.prototype.createFunctions = function () {
            var groupName, i;
            for (i = 0; i < this.groupNames.length; i += 1) {
                groupName = this.groupNames[i];
                this.createFunctionSetGroup(groupName);
                this.createFunctionGetGroup(groupName);
                this.createFunctionSet(groupName);
                this.createFunctionGet(groupName);
                this.createFunctionAdd(groupName);
                this.createFunctionDelete(groupName);
            }
        };
        GroupHoldr.prototype.createFunctionSetGroup = function (name) {
            var scope = this;
            this.functions.setGroup[name] = this["set" + name + "Group"] = function (value) {
                scope.groups[name] = value;
            };
        };
        GroupHoldr.prototype.createFunctionGetGroup = function (name) {
            var scope = this;
            this.functions.getGroup[name] = this["get" + name + "Group"] = function () {
                return scope.groups[name];
            };
        };
        GroupHoldr.prototype.createFunctionSet = function (name) {
            this.functions.set[name] = this["set" + name] = function (key, value) {
                if (value === void 0) { value = undefined; }
                this.groups[name][key] = value;
            };
        };
        GroupHoldr.prototype.createFunctionGet = function (name) {
            this.functions.get[name] = this["get" + name] = function (key) {
                return this.groups[name][key];
            };
        };
        GroupHoldr.prototype.createFunctionAdd = function (name) {
            var group = this.groups[name];
            if (this.groupTypes[name] === Object) {
                this.functions.add[name] = this["add" + name] = function (value, key) {
                    group[key] = value;
                };
            }
            else {
                this.functions.add[name] = this["add" + name] = function (value, key) {
                    if (key !== undefined) {
                        group[key] = value;
                    }
                    else {
                        group.push(value);
                    }
                };
            }
        };
        GroupHoldr.prototype.createFunctionDelete = function (name) {
            var group = this.groups[name];
            if (this.groupTypes[name] === Object) {
                this.functions.delete[name] = this["delete" + name] = function (key) {
                    delete group[key];
                };
            }
            else {
                this.functions.delete[name] = this["delete" + name] = function (value, index) {
                    if (index === void 0) { index = group.indexOf(value); }
                    if (index !== -1) {
                        group.splice(index, 1);
                    }
                };
            }
        };
        GroupHoldr.prototype.getTypeName = function (str) {
            if (str && str.charAt && str.charAt(0).toLowerCase() === "o") {
                return "Object";
            }
            return "Array";
        };
        GroupHoldr.prototype.getTypeFunction = function (str) {
            if (str && str.charAt && str.charAt(0).toLowerCase() === "o") {
                return Object;
            }
            return Array;
        };
        return GroupHoldr;
    })();
    GroupHoldr_1.GroupHoldr = GroupHoldr;
})(GroupHoldr || (GroupHoldr = {}));
var StringFilr;
(function (StringFilr_1) {
    "use strict";
    var StringFilr = (function () {
        function StringFilr(settings) {
            if (!settings) {
                throw new Error("No settings given to StringFilr.");
            }
            if (!settings.library) {
                throw new Error("No library given to StringFilr.");
            }
            this.library = settings.library;
            this.normal = settings.normal;
            this.requireNormalKey = settings.requireNormalKey;
            this.cache = {};
            if (this.requireNormalKey) {
                if (typeof this.normal === "undefined") {
                    throw new Error("StringFilr is given requireNormalKey, but no normal class.");
                }
                this.ensureLibraryNormal();
            }
        }
        StringFilr.prototype.getLibrary = function () {
            return this.library;
        };
        StringFilr.prototype.getNormal = function () {
            return this.normal;
        };
        StringFilr.prototype.getCache = function () {
            return this.cache;
        };
        StringFilr.prototype.getCached = function (key) {
            return this.cache[key];
        };
        StringFilr.prototype.clearCache = function () {
            this.cache = {};
        };
        StringFilr.prototype.clearCached = function (keyRaw) {
            delete this.cache[keyRaw];
            if (this.normal) {
                delete this.cache[keyRaw.replace(this.normal, "")];
            }
        };
        StringFilr.prototype.get = function (keyRaw) {
            var key, result;
            if (this.normal) {
                key = keyRaw.replace(this.normal, "");
            }
            else {
                key = keyRaw;
            }
            if (this.cache.hasOwnProperty(key)) {
                return this.cache[key];
            }
            result = this.followClass(key.split(/\s+/g), this.library);
            this.cache[key] = this.cache[keyRaw] = result;
            return result;
        };
        StringFilr.prototype.followClass = function (keys, current) {
            var key, i;
            if (!keys || !keys.length) {
                return current;
            }
            for (i = 0; i < keys.length; i += 1) {
                key = keys[i];
                if (current.hasOwnProperty(key)) {
                    keys.splice(i, 1);
                    return this.followClass(keys, current[key]);
                }
            }
            if (this.normal && current.hasOwnProperty(this.normal)) {
                return this.followClass(keys, current[this.normal]);
            }
            return current;
        };
        StringFilr.prototype.findLackingNormal = function (current, path, output) {
            var i;
            if (!current.hasOwnProperty(this.normal)) {
                output.push(path);
            }
            if (typeof current[i] === "object") {
                for (i in current) {
                    if (current.hasOwnProperty(i)) {
                        this.findLackingNormal(current[i], path + " " + i, output);
                    }
                }
            }
            return output;
        };
        StringFilr.prototype.ensureLibraryNormal = function () {
            var caught = this.findLackingNormal(this.library, "base", []);
            if (caught.length) {
                throw new Error("Found " + caught.length + " library "
                    + "sub-directories missing the normal: "
                    + "\r\n  " + caught.join("\r\n  "));
            }
        };
        return StringFilr;
    })();
    StringFilr_1.StringFilr = StringFilr;
})(StringFilr || (StringFilr = {}));
var PixelRendr;
(function (PixelRendr) {
    "use strict";
    var SpriteMultiple = (function () {
        function SpriteMultiple(sprites, render) {
            var sources = render.source[2];
            this.sprites = sprites;
            this.direction = render.source[1];
            if (this.direction === "vertical" || this.direction === "corners") {
                this.topheight = sources.topheight | 0;
                this.bottomheight = sources.bottomheight | 0;
            }
            if (this.direction === "horizontal" || this.direction === "corners") {
                this.rightwidth = sources.rightwidth | 0;
                this.leftwidth = sources.leftwidth | 0;
            }
            this.middleStretch = sources.middleStretch || false;
        }
        return SpriteMultiple;
    })();
    PixelRendr.SpriteMultiple = SpriteMultiple;
})(PixelRendr || (PixelRendr = {}));
var PixelRendr;
(function (PixelRendr) {
    "use strict";
    var Render = (function () {
        function Render(source, filter) {
            this.source = source;
            this.filter = filter;
            this.sprites = {};
            this.containers = [];
        }
        return Render;
    })();
    PixelRendr.Render = Render;
})(PixelRendr || (PixelRendr = {}));
var PixelRendr;
(function (PixelRendr_1) {
    "use strict";
    var PixelRendr = (function () {
        function PixelRendr(settings) {
            if (!settings) {
                throw new Error("No settings given to PixelRendr.");
            }
            if (!settings.paletteDefault) {
                throw new Error("No paletteDefault given to PixelRendr.");
            }
            this.paletteDefault = settings.paletteDefault;
            this.digitsizeDefault = this.getDigitSizeFromArray(this.paletteDefault);
            this.digitsplit = new RegExp(".{1," + this.digitsizeDefault + "}", "g");
            this.library = {
                "raws": settings.library || {}
            };
            this.scale = settings.scale || 1;
            this.filters = settings.filters || {};
            this.flipVert = settings.flipVert || "flip-vert";
            this.flipHoriz = settings.flipHoriz || "flip-horiz";
            this.spriteWidth = settings.spriteWidth || "spriteWidth";
            this.spriteHeight = settings.spriteHeight || "spriteHeight";
            this.Uint8ClampedArray = settings.Uint8ClampedArray || window.Uint8ClampedArray || window.Uint8Array;
            this.ProcessorBase = new ChangeLinr.ChangeLinr({
                "transforms": {
                    "spriteUnravel": this.spriteUnravel.bind(this),
                    "spriteApplyFilter": this.spriteApplyFilter.bind(this),
                    "spriteExpand": this.spriteExpand.bind(this),
                    "spriteGetArray": this.spriteGetArray.bind(this)
                },
                "pipeline": ["spriteUnravel", "spriteApplyFilter", "spriteExpand", "spriteGetArray"]
            });
            this.ProcessorDims = new ChangeLinr.ChangeLinr({
                "transforms": {
                    "spriteRepeatRows": this.spriteRepeatRows.bind(this),
                    "spriteFlipDimensions": this.spriteFlipDimensions.bind(this)
                },
                "pipeline": ["spriteRepeatRows", "spriteFlipDimensions"]
            });
            this.ProcessorEncode = new ChangeLinr.ChangeLinr({
                "transforms": {
                    "imageGetData": this.imageGetData.bind(this),
                    "imageGetPixels": this.imageGetPixels.bind(this),
                    "imageMapPalette": this.imageMapPalette.bind(this),
                    "imageCombinePixels": this.imageCombinePixels.bind(this)
                },
                "pipeline": ["imageGetData", "imageGetPixels", "imageMapPalette", "imageCombinePixels"],
                "doUseCache": false
            });
            this.library.sprites = this.libraryParse(this.library.raws);
            this.BaseFiler = new StringFilr.StringFilr({
                "library": this.library.sprites,
                "normal": "normal"
            });
            this.commandGenerators = {
                "multiple": this.generateSpriteCommandMultipleFromRender.bind(this),
                "same": this.generateSpriteCommandSameFromRender.bind(this),
                "filter": this.generateSpriteCommandFilterFromRender.bind(this)
            };
        }
        PixelRendr.prototype.getBaseLibrary = function () {
            return this.BaseFiler.getLibrary();
        };
        PixelRendr.prototype.getBaseFiler = function () {
            return this.BaseFiler;
        };
        PixelRendr.prototype.getProcessorBase = function () {
            return this.ProcessorBase;
        };
        PixelRendr.prototype.getProcessorDims = function () {
            return this.ProcessorDims;
        };
        PixelRendr.prototype.getProcessorEncode = function () {
            return this.ProcessorEncode;
        };
        PixelRendr.prototype.getSpriteBase = function (key) {
            return this.BaseFiler.get(key);
        };
        PixelRendr.prototype.decode = function (key, attributes) {
            var render = this.BaseFiler.get(key), sprite;
            if (!render) {
                throw new Error("No sprite found for " + key + ".");
            }
            if (!render.sprites.hasOwnProperty(key)) {
                this.generateRenderSprite(render, key, attributes);
            }
            sprite = render.sprites[key];
            if (!sprite || (sprite.constructor === this.Uint8ClampedArray && sprite.length === 0)) {
                throw new Error("Could not generate sprite for " + key + ".");
            }
            return sprite;
        };
        PixelRendr.prototype.encode = function (image, callback) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var result = this.ProcessorEncode.process(image);
            if (callback) {
                callback.apply(void 0, [result, image].concat(args));
            }
            return result;
        };
        PixelRendr.prototype.encodeUri = function (uri, callback) {
            var image = document.createElement("img");
            image.onload = this.encode.bind(this, image, callback);
            image.src = uri;
        };
        PixelRendr.prototype.generatePaletteFromRawData = function (data, forceZeroColor, giveArrays) {
            var tree = {}, colorsGeneral = [], colorsGrayscale = [], output, i;
            for (i = 0; i < data.length; i += 4) {
                if (data[i + 3] === 0) {
                    forceZeroColor = true;
                    continue;
                }
                if (tree[data[i]]
                    && tree[data[i]][data[i + 1]]
                    && tree[data[i]][data[i + 1]][data[i + 2]]
                    && tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]]) {
                    continue;
                }
                if (!tree[data[i]]) {
                    tree[data[i]] = {};
                }
                if (!tree[data[i]][data[i + 1]]) {
                    tree[data[i]][data[i + 1]] = {};
                }
                if (!tree[data[i]][data[i + 1]][data[i + 2]]) {
                    tree[data[i]][data[i + 1]][data[i + 2]] = {};
                }
                if (!tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]]) {
                    tree[data[i]][data[i + 1]][data[i + 2]][data[i + 3]] = true;
                    if (data[i] === data[i + 1] && data[i + 1] === data[i + 2]) {
                        colorsGrayscale.push(data.subarray(i, i + 4));
                    }
                    else {
                        colorsGeneral.push(data.subarray(i, i + 4));
                    }
                }
            }
            colorsGrayscale.sort(function (a, b) {
                return a[0] - b[0];
            });
            colorsGeneral.sort(function (a, b) {
                for (i = 0; i < 4; i += 1) {
                    if (a[i] !== b[i]) {
                        return b[i] - a[i];
                    }
                }
            });
            if (forceZeroColor) {
                output = [new this.Uint8ClampedArray([0, 0, 0, 0])]
                    .concat(colorsGrayscale)
                    .concat(colorsGeneral);
            }
            else {
                output = colorsGrayscale.concat(colorsGeneral);
            }
            if (!giveArrays) {
                return output;
            }
            for (i = 0; i < output.length; i += 1) {
                output[i] = Array.prototype.slice.call(output[i]);
            }
            return output;
        };
        PixelRendr.prototype.memcpyU8 = function (source, destination, readloc, writeloc, writelength) {
            if (readloc === void 0) { readloc = 0; }
            if (writeloc === void 0) { writeloc = 0; }
            if (writelength === void 0) { writelength = Math.max(0, Math.min(source.length, destination.length)); }
            var lwritelength = writelength + 0, lwriteloc = writeloc + 0, lreadloc = readloc + 0;
            while (lwritelength--) {
                destination[lwriteloc++] = source[lreadloc++];
            }
        };
        PixelRendr.prototype.libraryParse = function (reference) {
            var setNew = {}, source, i;
            for (i in reference) {
                if (!reference.hasOwnProperty(i)) {
                    continue;
                }
                source = reference[i];
                switch (source.constructor) {
                    case String:
                        setNew[i] = new PixelRendr_1.Render(source);
                        break;
                    case Array:
                        setNew[i] = new PixelRendr_1.Render(source, source[1]);
                        break;
                    default:
                        setNew[i] = this.libraryParse(source);
                        break;
                }
                if (setNew[i].constructor === PixelRendr_1.Render) {
                    setNew[i].containers.push({
                        "container": setNew,
                        "key": i
                    });
                }
            }
            return setNew;
        };
        PixelRendr.prototype.generateRenderSprite = function (render, key, attributes) {
            var sprite;
            if (render.source.constructor === String) {
                sprite = this.generateSpriteSingleFromRender(render, key, attributes);
            }
            else {
                sprite = this.commandGenerators[render.source[0]](render, key, attributes);
            }
            render.sprites[key] = sprite;
        };
        PixelRendr.prototype.generateSpriteSingleFromRender = function (render, key, attributes) {
            var base = this.ProcessorBase.process(render.source, key, render.filter), sprite = this.ProcessorDims.process(base, key, attributes);
            return sprite;
        };
        PixelRendr.prototype.generateSpriteCommandMultipleFromRender = function (render, key, attributes) {
            var sources = render.source[2], sprites = {}, sprite, path, output = new PixelRendr_1.SpriteMultiple(sprites, render), i;
            for (i in sources) {
                if (sources.hasOwnProperty(i)) {
                    path = key + " " + i;
                    sprite = this.ProcessorBase.process(sources[i], path, render.filter);
                    sprites[i] = this.ProcessorDims.process(sprite, path, attributes);
                }
            }
            return output;
        };
        PixelRendr.prototype.generateSpriteCommandSameFromRender = function (render, key, attributes) {
            var replacement = this.followPath(this.library.sprites, render.source[1], 0);
            this.replaceRenderInContainers(render, replacement);
            this.BaseFiler.clearCached(key);
            return this.decode(key, attributes);
        };
        PixelRendr.prototype.generateSpriteCommandFilterFromRender = function (render, key, attributes) {
            var filter = this.filters[render.source[2]], found = this.followPath(this.library.sprites, render.source[1], 0), filtered;
            if (!filter) {
                console.warn("Invalid filter provided: " + render.source[2]);
            }
            if (found.constructor === PixelRendr_1.Render) {
                filtered = new PixelRendr_1.Render(found.source, { filter: filter });
                this.generateRenderSprite(filtered, key, attributes);
            }
            else {
                filtered = this.generateRendersFromFilter(found, filter);
            }
            this.replaceRenderInContainers(render, filtered);
            if (filtered.constructor === PixelRendr_1.Render) {
                return filtered.sprites[key];
            }
            else {
                this.BaseFiler.clearCached(key);
                return this.decode(key, attributes);
            }
        };
        PixelRendr.prototype.generateRendersFromFilter = function (directory, filter) {
            var output = {}, child, i;
            for (i in directory) {
                if (!directory.hasOwnProperty(i)) {
                    continue;
                }
                child = directory[i];
                if (child.constructor === PixelRendr_1.Render) {
                    output[i] = new PixelRendr_1.Render(child.source, {
                        "filter": filter
                    });
                }
                else {
                    output[i] = this.generateRendersFromFilter(child, filter);
                }
            }
            return output;
        };
        PixelRendr.prototype.replaceRenderInContainers = function (render, replacement) {
            var listing, i;
            for (i = 0; i < render.containers.length; i += 1) {
                listing = render.containers[i];
                listing.container[listing.key] = replacement;
                if (replacement.constructor === PixelRendr_1.Render) {
                    replacement.containers.push(listing);
                }
            }
        };
        PixelRendr.prototype.spriteUnravel = function (colors) {
            var paletteref = this.getPaletteReferenceStarting(this.paletteDefault), digitsize = this.digitsizeDefault, clength = colors.length, current, rep, nixloc, output = "", loc = 0;
            while (loc < clength) {
                switch (colors[loc]) {
                    case "x":
                        nixloc = colors.indexOf(",", ++loc);
                        current = this.makeDigit(paletteref[colors.slice(loc, loc += digitsize)], this.digitsizeDefault);
                        rep = Number(colors.slice(loc, nixloc));
                        while (rep--) {
                            output += current;
                        }
                        loc = nixloc + 1;
                        break;
                    case "p":
                        if (colors[++loc] === "[") {
                            nixloc = colors.indexOf("]");
                            paletteref = this.getPaletteReference(colors.slice(loc + 1, nixloc).split(","));
                            loc = nixloc + 1;
                            digitsize = this.getDigitSizeFromObject(paletteref);
                        }
                        else {
                            paletteref = this.getPaletteReference(this.paletteDefault);
                            digitsize = this.digitsizeDefault;
                        }
                        break;
                    default:
                        output += this.makeDigit(paletteref[colors.slice(loc, loc += digitsize)], this.digitsizeDefault);
                        break;
                }
            }
            return output;
        };
        PixelRendr.prototype.spriteExpand = function (colors) {
            var output = "", clength = colors.length, i = 0, j, current;
            while (i < clength) {
                current = colors.slice(i, i += this.digitsizeDefault);
                for (j = 0; j < this.scale; ++j) {
                    output += current;
                }
            }
            return output;
        };
        PixelRendr.prototype.spriteApplyFilter = function (colors, key, attributes) {
            if (!attributes || !attributes.filter) {
                return colors;
            }
            var filter = attributes.filter, filterName = filter[0];
            if (!filterName) {
                return colors;
            }
            switch (filterName) {
                case "palette":
                    var split = colors.match(this.digitsplit), i;
                    for (i in filter[1]) {
                        if (filter[1].hasOwnProperty(i)) {
                            this.arrayReplace(split, i, filter[1][i]);
                        }
                    }
                    return split.join("");
                default:
                    console.warn("Unknown filter: '" + filterName + "'.");
            }
            return colors;
        };
        PixelRendr.prototype.spriteGetArray = function (colors) {
            var clength = colors.length, numcolors = clength / this.digitsizeDefault, split = colors.match(this.digitsplit), olength = numcolors * 4, output = new this.Uint8ClampedArray(olength), reference, i, j, k;
            for (i = 0, j = 0; i < numcolors; ++i) {
                reference = this.paletteDefault[Number(split[i])];
                for (k = 0; k < 4; ++k) {
                    output[j + k] = reference[k];
                }
                j += 4;
            }
            return output;
        };
        PixelRendr.prototype.spriteRepeatRows = function (sprite, key, attributes) {
            var parsed = new this.Uint8ClampedArray(sprite.length * this.scale), rowsize = attributes[this.spriteWidth] * 4, height = attributes[this.spriteHeight] / this.scale, readloc = 0, writeloc = 0, i, j;
            for (i = 0; i < height; ++i) {
                for (j = 0; j < this.scale; ++j) {
                    this.memcpyU8(sprite, parsed, readloc, writeloc, rowsize);
                    writeloc += rowsize;
                }
                readloc += rowsize;
            }
            return parsed;
        };
        PixelRendr.prototype.spriteFlipDimensions = function (sprite, key, attributes) {
            if (key.indexOf(this.flipHoriz) !== -1) {
                if (key.indexOf(this.flipVert) !== -1) {
                    return this.flipSpriteArrayBoth(sprite);
                }
                else {
                    return this.flipSpriteArrayHoriz(sprite, attributes);
                }
            }
            else if (key.indexOf(this.flipVert) !== -1) {
                return this.flipSpriteArrayVert(sprite, attributes);
            }
            return sprite;
        };
        PixelRendr.prototype.flipSpriteArrayHoriz = function (sprite, attributes) {
            var length = sprite.length + 0, width = attributes[this.spriteWidth] + 0, newsprite = new this.Uint8ClampedArray(length), rowsize = width * 4, newloc, oldloc, i, j, k;
            for (i = 0; i < length; i += rowsize) {
                newloc = i;
                oldloc = i + rowsize - 4;
                for (j = 0; j < rowsize; j += 4) {
                    for (k = 0; k < 4; ++k) {
                        newsprite[newloc + k] = sprite[oldloc + k];
                    }
                    newloc += 4;
                    oldloc -= 4;
                }
            }
            return newsprite;
        };
        PixelRendr.prototype.flipSpriteArrayVert = function (sprite, attributes) {
            var length = sprite.length, width = attributes[this.spriteWidth] + 0, newsprite = new this.Uint8ClampedArray(length), rowsize = width * 4, newloc = 0, oldloc = length - rowsize, i, j;
            while (newloc < length) {
                for (i = 0; i < rowsize; i += 4) {
                    for (j = 0; j < 4; ++j) {
                        newsprite[newloc + i + j] = sprite[oldloc + i + j];
                    }
                }
                newloc += rowsize;
                oldloc -= rowsize;
            }
            return newsprite;
        };
        PixelRendr.prototype.flipSpriteArrayBoth = function (sprite) {
            var length = sprite.length, newsprite = new this.Uint8ClampedArray(length), oldloc = sprite.length - 4, newloc = 0, i;
            while (newloc < length) {
                for (i = 0; i < 4; ++i) {
                    newsprite[newloc + i] = sprite[oldloc + i];
                }
                newloc += 4;
                oldloc -= 4;
            }
            return newsprite;
        };
        PixelRendr.prototype.imageGetData = function (image) {
            var canvas = document.createElement("canvas"), context = canvas.getContext("2d");
            canvas.width = image.width;
            canvas.height = image.height;
            context.drawImage(image, 0, 0);
            return context.getImageData(0, 0, image.width, image.height).data;
        };
        PixelRendr.prototype.imageGetPixels = function (data) {
            var pixels = new Array(data.length / 4), occurences = {}, pixel, i, j;
            for (i = 0, j = 0; i < data.length; i += 4, j += 1) {
                pixel = this.getClosestInPalette(this.paletteDefault, data.subarray(i, i + 4));
                pixels[j] = pixel;
                if (occurences.hasOwnProperty(pixel)) {
                    occurences[pixel] += 1;
                }
                else {
                    occurences[pixel] = 1;
                }
            }
            return [pixels, occurences];
        };
        PixelRendr.prototype.imageMapPalette = function (information) {
            var pixels = information[0], occurences = information[1], palette = Object.keys(occurences), digitsize = this.getDigitSizeFromArray(palette), paletteIndices = this.getValueIndices(palette), numbers = pixels.map(function (pixel) { return paletteIndices[pixel]; });
            return [palette, numbers, digitsize];
        };
        PixelRendr.prototype.imageCombinePixels = function (information) {
            var palette = information[0], numbers = information[1], digitsize = information[2], threshold = Math.max(3, Math.round(4 / digitsize)), output, current, digit, i = 0, j;
            output = "p[" + palette.map(this.makeSizedDigit.bind(this, digitsize)).join(",") + "]";
            while (i < numbers.length) {
                j = i + 1;
                current = numbers[i];
                digit = this.makeDigit(current, digitsize);
                while (current === numbers[j]) {
                    j += 1;
                }
                if (j - i > threshold) {
                    output += "x" + digit + String(j - i) + ",";
                    i = j;
                }
                else {
                    do {
                        output += digit;
                        i += 1;
                    } while (i < j);
                }
            }
            return output;
        };
        PixelRendr.prototype.getDigitSizeFromArray = function (palette) {
            var digitsize = 0, i;
            for (i = palette.length; i >= 1; i /= 10) {
                digitsize += 1;
            }
            return digitsize;
        };
        PixelRendr.prototype.getDigitSizeFromObject = function (palette) {
            return this.getDigitSizeFromArray(Object.keys(palette));
        };
        PixelRendr.prototype.getPaletteReference = function (palette) {
            var output = {}, digitsize = this.getDigitSizeFromArray(palette), i;
            for (i = 0; i < palette.length; i += 1) {
                output[this.makeDigit(i, digitsize)] = this.makeDigit(palette[i], digitsize);
            }
            return output;
        };
        PixelRendr.prototype.getPaletteReferenceStarting = function (palette) {
            var output = {}, digit, i;
            for (i = 0; i < palette.length; i += 1) {
                digit = this.makeDigit(i, this.digitsizeDefault);
                output[digit] = digit;
            }
            return output;
        };
        PixelRendr.prototype.getClosestInPalette = function (palette, rgba) {
            var bestDifference = Infinity, difference, bestIndex, i;
            for (i = palette.length - 1; i >= 0; i -= 1) {
                difference = this.arrayDifference(palette[i], rgba);
                if (difference < bestDifference) {
                    bestDifference = difference;
                    bestIndex = i;
                }
            }
            return bestIndex;
        };
        PixelRendr.prototype.stringOf = function (string, times) {
            return (times === 0) ? "" : new Array(1 + (times || 1)).join(string);
        };
        PixelRendr.prototype.makeDigit = function (num, size, prefix) {
            if (prefix === void 0) { prefix = "0"; }
            return this.stringOf(prefix, Math.max(0, size - String(num).length)) + num;
        };
        PixelRendr.prototype.makeSizedDigit = function (size, number) {
            return this.makeDigit(number, size, "0");
        };
        PixelRendr.prototype.arrayReplace = function (array, removed, inserted) {
            for (var i = 0; i < array.length; i += 1) {
                if (array[i] === removed) {
                    array[i] = inserted;
                }
            }
            return array;
        };
        PixelRendr.prototype.arrayDifference = function (a, b) {
            var sum = 0, i;
            for (i = a.length - 1; i >= 0; i -= 1) {
                sum += Math.abs(a[i] - b[i]) | 0;
            }
            return sum;
        };
        PixelRendr.prototype.getValueIndices = function (array) {
            var output = {}, i;
            for (i = 0; i < array.length; i += 1) {
                output[array[i]] = i;
            }
            return output;
        };
        PixelRendr.prototype.followPath = function (object, path, index) {
            if (index < path.length && object.hasOwnProperty(path[index])) {
                return this.followPath(object[path[index]], path, index + 1);
            }
            return object;
        };
        return PixelRendr;
    })();
    PixelRendr_1.PixelRendr = PixelRendr;
})(PixelRendr || (PixelRendr = {}));
var QuadsKeepr;
(function (QuadsKeepr_1) {
    "use strict";
    var QuadsKeepr = (function () {
        function QuadsKeepr(settings) {
            if (!settings) {
                throw new Error("No settings object given to QuadsKeepr.");
            }
            if (!settings.ObjectMaker) {
                throw new Error("No ObjectMaker given to QuadsKeepr.");
            }
            if (!settings.numRows) {
                throw new Error("No numRows given to QuadsKeepr.");
            }
            if (!settings.numCols) {
                throw new Error("No numCols given to QuadsKeepr.");
            }
            if (!settings.quadrantWidth) {
                throw new Error("No quadrantWidth given to QuadsKeepr.");
            }
            if (!settings.quadrantHeight) {
                throw new Error("No quadrantHeight given to QuadsKeepr.");
            }
            if (!settings.groupNames) {
                throw new Error("No groupNames given to QuadsKeepr.");
            }
            this.ObjectMaker = settings.ObjectMaker;
            this.numRows = settings.numRows | 0;
            this.numCols = settings.numCols | 0;
            this.quadrantWidth = settings.quadrantWidth | 0;
            this.quadrantHeight = settings.quadrantHeight | 0;
            this.groupNames = settings.groupNames;
            this.onAdd = settings.onAdd;
            this.onRemove = settings.onRemove;
            this.startLeft = settings.startLeft | 0;
            this.startTop = settings.startTop | 0;
            this.keyTop = settings.keyTop || "top";
            this.keyLeft = settings.keyLeft || "left";
            this.keyBottom = settings.keyBottom || "bottom";
            this.keyRight = settings.keyRight || "right";
            this.keyNumQuads = settings.keyNumQuads || "numquads";
            this.keyQuadrants = settings.keyQuadrants || "quadrants";
            this.keyChanged = settings.keyChanged || "changed";
            this.keyToleranceX = settings.keyToleranceX || "tolx";
            this.keyToleranceY = settings.keyToleranceY || "toly";
            this.keyGroupName = settings.keyGroupName || "group";
            this.keyOffsetX = settings.keyOffsetX;
            this.keyOffsetY = settings.keyOffsetY;
        }
        QuadsKeepr.prototype.getQuadrantRows = function () {
            return this.quadrantRows;
        };
        QuadsKeepr.prototype.getQuadrantCols = function () {
            return this.quadrantCols;
        };
        QuadsKeepr.prototype.getNumRows = function () {
            return this.numRows;
        };
        QuadsKeepr.prototype.getNumCols = function () {
            return this.numCols;
        };
        QuadsKeepr.prototype.getQuadrantWidth = function () {
            return this.quadrantWidth;
        };
        QuadsKeepr.prototype.getQuadrantHeight = function () {
            return this.quadrantHeight;
        };
        QuadsKeepr.prototype.resetQuadrants = function () {
            var left = this.startLeft, top = this.startTop, quadrant, i, j;
            this.top = this.startTop;
            this.right = this.startLeft + this.quadrantWidth * this.numCols;
            this.bottom = this.startTop + this.quadrantHeight * this.numRows;
            this.left = this.startLeft;
            this.quadrantRows = [];
            this.quadrantCols = [];
            this.offsetX = 0;
            this.offsetY = 0;
            for (i = 0; i < this.numRows; i += 1) {
                this.quadrantRows.push({
                    "left": this.startLeft,
                    "top": top,
                    "quadrants": []
                });
                top += this.quadrantHeight;
            }
            for (j = 0; j < this.numCols; j += 1) {
                this.quadrantCols.push({
                    "left": left,
                    "top": this.startTop,
                    "quadrants": []
                });
                left += this.quadrantWidth;
            }
            top = this.startTop;
            for (i = 0; i < this.numRows; i += 1) {
                left = this.startLeft;
                for (j = 0; j < this.numCols; j += 1) {
                    quadrant = this.createQuadrant(left, top);
                    this.quadrantRows[i].quadrants.push(quadrant);
                    this.quadrantCols[j].quadrants.push(quadrant);
                    left += this.quadrantWidth;
                }
                top += this.quadrantHeight;
            }
            if (this.onAdd) {
                this.onAdd("xInc", this.top, this.right, this.bottom, this.left);
            }
        };
        QuadsKeepr.prototype.shiftQuadrants = function (dx, dy) {
            if (dx === void 0) { dx = 0; }
            if (dy === void 0) { dy = 0; }
            var row, col;
            dx = dx | 0;
            dy = dy | 0;
            this.offsetX += dx;
            this.offsetY += dy;
            this.top += dy;
            this.right += dx;
            this.bottom += dy;
            this.left += dx;
            for (row = 0; row < this.numRows; row += 1) {
                this.quadrantRows[row].left += dx;
                this.quadrantRows[row].top += dy;
            }
            for (col = 0; col < this.numCols; col += 1) {
                this.quadrantCols[col].left += dx;
                this.quadrantCols[col].top += dy;
            }
            for (row = 0; row < this.numRows; row += 1) {
                for (col = 0; col < this.numCols; col += 1) {
                    this.shiftQuadrant(this.quadrantRows[row].quadrants[col], dx, dy);
                }
            }
            this.adjustOffsets();
        };
        QuadsKeepr.prototype.pushQuadrantRow = function (callUpdate) {
            var row = this.createQuadrantRow(this.left, this.bottom), i;
            this.numRows += 1;
            this.quadrantRows.push(row);
            for (i = 0; i < this.quadrantCols.length; i += 1) {
                this.quadrantCols[i].quadrants.push(row.quadrants[i]);
            }
            this.bottom += this.quadrantHeight;
            if (callUpdate && this.onAdd) {
                this.onAdd("yInc", this.bottom, this.right, this.bottom - this.quadrantHeight, this.left);
            }
            return row;
        };
        QuadsKeepr.prototype.pushQuadrantCol = function (callUpdate) {
            var col = this.createQuadrantCol(this.right, this.top), i;
            this.numCols += 1;
            this.quadrantCols.push(col);
            for (i = 0; i < this.quadrantRows.length; i += 1) {
                this.quadrantRows[i].quadrants.push(col.quadrants[i]);
            }
            this.right += this.quadrantWidth;
            if (callUpdate && this.onAdd) {
                this.onAdd("xInc", this.top, this.right - this.offsetY, this.bottom, this.right - this.quadrantWidth - this.offsetY);
            }
            return col;
        };
        QuadsKeepr.prototype.popQuadrantRow = function (callUpdate) {
            for (var i = 0; i < this.quadrantCols.length; i += 1) {
                this.quadrantCols[i].quadrants.pop();
            }
            this.numRows -= 1;
            this.quadrantRows.pop();
            if (callUpdate && this.onRemove) {
                this.onRemove("yInc", this.bottom, this.right, this.bottom - this.quadrantHeight, this.left);
            }
            this.bottom -= this.quadrantHeight;
        };
        QuadsKeepr.prototype.popQuadrantCol = function (callUpdate) {
            for (var i = 0; i < this.quadrantRows.length; i += 1) {
                this.quadrantRows[i].quadrants.pop();
            }
            this.numCols -= 1;
            this.quadrantCols.pop();
            if (callUpdate && this.onRemove) {
                this.onRemove("xDec", this.top, this.right - this.offsetY, this.bottom, this.right - this.quadrantWidth - this.offsetY);
            }
            this.right -= this.quadrantWidth;
        };
        QuadsKeepr.prototype.unshiftQuadrantRow = function (callUpdate) {
            var row = this.createQuadrantRow(this.left, this.top - this.quadrantHeight), i;
            this.numRows += 1;
            this.quadrantRows.unshift(row);
            for (i = 0; i < this.quadrantCols.length; i += 1) {
                this.quadrantCols[i].quadrants.unshift(row.quadrants[i]);
            }
            this.top -= this.quadrantHeight;
            if (callUpdate && this.onAdd) {
                this.onAdd("yDec", this.top, this.right, this.top + this.quadrantHeight, this.left);
            }
            return row;
        };
        QuadsKeepr.prototype.unshiftQuadrantCol = function (callUpdate) {
            var col = this.createQuadrantCol(this.left - this.quadrantWidth, this.top), i;
            this.numCols += 1;
            this.quadrantCols.unshift(col);
            for (i = 0; i < this.quadrantRows.length; i += 1) {
                this.quadrantRows[i].quadrants.unshift(col.quadrants[i]);
            }
            this.left -= this.quadrantWidth;
            if (callUpdate && this.onAdd) {
                this.onAdd("xDec", this.top, this.left, this.bottom, this.left + this.quadrantWidth);
            }
            return col;
        };
        QuadsKeepr.prototype.shiftQuadrantRow = function (callUpdate) {
            for (var i = 0; i < this.quadrantCols.length; i += 1) {
                this.quadrantCols[i].quadrants.shift();
            }
            this.numRows -= 1;
            this.quadrantRows.pop();
            if (callUpdate && this.onRemove) {
                this.onRemove("yInc", this.top, this.right, this.top + this.quadrantHeight, this.left);
            }
            this.top += this.quadrantHeight;
        };
        QuadsKeepr.prototype.shiftQuadrantCol = function (callUpdate) {
            for (var i = 0; i < this.quadrantRows.length; i += 1) {
                this.quadrantRows[i].quadrants.shift();
            }
            this.numCols -= 1;
            this.quadrantCols.pop();
            if (callUpdate && this.onRemove) {
                this.onRemove("xInc", this.top, this.left + this.quadrantWidth, this.bottom, this.left);
            }
            this.left += this.quadrantWidth;
        };
        QuadsKeepr.prototype.determineAllQuadrants = function (group, things) {
            var row, col;
            for (row = 0; row < this.numRows; row += 1) {
                for (col = 0; col < this.numCols; col += 1) {
                    this.quadrantRows[row].quadrants[col].numthings[group] = 0;
                }
            }
            things.forEach(this.determineThingQuadrants.bind(this));
        };
        QuadsKeepr.prototype.determineThingQuadrants = function (thing) {
            var group = thing[this.keyGroupName], rowStart = this.findQuadrantRowStart(thing), colStart = this.findQuadrantColStart(thing), rowEnd = this.findQuadrantRowEnd(thing), colEnd = this.findQuadrantColEnd(thing), row, col;
            if (thing[this.keyChanged]) {
                this.markThingQuadrantsChanged(thing);
            }
            thing[this.keyNumQuads] = 0;
            for (row = rowStart; row <= rowEnd; row += 1) {
                for (col = colStart; col <= colEnd; col += 1) {
                    this.setThingInQuadrant(thing, this.quadrantRows[row].quadrants[col], group);
                }
            }
            thing[this.keyChanged] = false;
        };
        QuadsKeepr.prototype.setThingInQuadrant = function (thing, quadrant, group) {
            thing[this.keyQuadrants][thing[this.keyNumQuads]] = quadrant;
            thing[this.keyNumQuads] += 1;
            quadrant.things[group][quadrant.numthings[group]] = thing;
            quadrant.numthings[group] += 1;
            if (thing[this.keyChanged]) {
                quadrant[this.keyChanged] = true;
            }
        };
        QuadsKeepr.prototype.adjustOffsets = function () {
            while (-this.offsetX > this.quadrantWidth) {
                this.shiftQuadrantCol(true);
                this.pushQuadrantCol(true);
                this.offsetX += this.quadrantWidth;
            }
            while (this.offsetX > this.quadrantWidth) {
                this.popQuadrantCol(true);
                this.unshiftQuadrantCol(true);
                this.offsetX -= this.quadrantWidth;
            }
            while (-this.offsetY > this.quadrantHeight) {
                this.unshiftQuadrantRow(true);
                this.pushQuadrantRow(true);
                this.offsetY += this.quadrantHeight;
            }
            while (this.offsetY > this.quadrantHeight) {
                this.popQuadrantRow(true);
                this.unshiftQuadrantRow(true);
                this.offsetY -= this.quadrantHeight;
            }
        };
        QuadsKeepr.prototype.shiftQuadrant = function (quadrant, dx, dy) {
            quadrant.top += dy;
            quadrant.right += dx;
            quadrant.bottom += dy;
            quadrant.left += dx;
            quadrant[this.keyChanged] = true;
        };
        QuadsKeepr.prototype.createQuadrant = function (left, top) {
            var quadrant = this.ObjectMaker.make("Quadrant"), i;
            quadrant[this.keyChanged] = true;
            quadrant.things = {};
            quadrant.numthings = {};
            for (i = 0; i < this.groupNames.length; i += 1) {
                quadrant.things[this.groupNames[i]] = [];
                quadrant.numthings[this.groupNames[i]] = 0;
            }
            quadrant.left = left;
            quadrant.top = top;
            quadrant.right = left + this.quadrantWidth;
            quadrant.bottom = top + this.quadrantHeight;
            return quadrant;
        };
        QuadsKeepr.prototype.createQuadrantRow = function (left, top) {
            if (left === void 0) { left = 0; }
            if (top === void 0) { top = 0; }
            var row = {
                "left": left,
                "top": top,
                "quadrants": []
            }, i;
            for (i = 0; i < this.numCols; i += 1) {
                row.quadrants.push(this.createQuadrant(left, top));
                left += this.quadrantWidth;
            }
            return row;
        };
        QuadsKeepr.prototype.createQuadrantCol = function (left, top) {
            var col = {
                "left": left,
                "top": top,
                "quadrants": []
            }, i;
            for (i = 0; i < this.numRows; i += 1) {
                col.quadrants.push(this.createQuadrant(left, top));
                top += this.quadrantHeight;
            }
            return col;
        };
        QuadsKeepr.prototype.getTop = function (thing) {
            if (this.keyOffsetY) {
                return thing[this.keyTop] - Math.abs(thing[this.keyOffsetY]);
            }
            else {
                return thing[this.keyTop];
            }
        };
        QuadsKeepr.prototype.getRight = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyRight] + Math.abs(thing[this.keyOffsetX]);
            }
            else {
                return thing[this.keyRight];
            }
        };
        QuadsKeepr.prototype.getBottom = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyBottom] + Math.abs(thing[this.keyOffsetY]);
            }
            else {
                return thing[this.keyBottom];
            }
        };
        QuadsKeepr.prototype.getLeft = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyLeft] - Math.abs(thing[this.keyOffsetX]);
            }
            else {
                return thing[this.keyLeft];
            }
        };
        QuadsKeepr.prototype.markThingQuadrantsChanged = function (thing) {
            for (var i = 0; i < thing[this.keyNumQuads]; i += 1) {
                thing[this.keyQuadrants][i][this.keyChanged] = true;
            }
        };
        QuadsKeepr.prototype.findQuadrantRowStart = function (thing) {
            return Math.max(Math.floor((this.getTop(thing) - this.top) / this.quadrantHeight), 0);
        };
        QuadsKeepr.prototype.findQuadrantRowEnd = function (thing) {
            return Math.min(Math.floor((this.getBottom(thing) - this.top) / this.quadrantHeight), this.numRows - 1);
        };
        QuadsKeepr.prototype.findQuadrantColStart = function (thing) {
            return Math.max(Math.floor((this.getLeft(thing) - this.left) / this.quadrantWidth), 0);
        };
        QuadsKeepr.prototype.findQuadrantColEnd = function (thing) {
            return Math.min(Math.floor((this.getRight(thing) - this.left) / this.quadrantWidth), this.numCols - 1);
        };
        return QuadsKeepr;
    })();
    QuadsKeepr_1.QuadsKeepr = QuadsKeepr;
})(QuadsKeepr || (QuadsKeepr = {}));
var PixelDrawr;
(function (PixelDrawr_1) {
    "use strict";
    var PixelDrawr = (function () {
        function PixelDrawr(settings) {
            if (!settings) {
                throw new Error("No settings object given to PixelDrawr.");
            }
            if (typeof settings.PixelRender === "undefined") {
                throw new Error("No PixelRender given to PixelDrawr.");
            }
            if (typeof settings.MapScreener === "undefined") {
                throw new Error("No MapScreener given to PixelDrawr.");
            }
            if (typeof settings.createCanvas === "undefined") {
                throw new Error("No createCanvas given to PixelDrawr.");
            }
            this.PixelRender = settings.PixelRender;
            this.MapScreener = settings.MapScreener;
            this.createCanvas = settings.createCanvas;
            this.unitsize = settings.unitsize || 1;
            this.noRefill = settings.noRefill;
            this.spriteCacheCutoff = settings.spriteCacheCutoff || 0;
            this.groupNames = settings.groupNames;
            this.framerateSkip = settings.framerateSkip || 1;
            this.framesDrawn = 0;
            this.epsilon = settings.epsilon || .007;
            this.keyWidth = settings.keyWidth || "width";
            this.keyHeight = settings.keyHeight || "height";
            this.keyTop = settings.keyTop || "top";
            this.keyRight = settings.keyRight || "right";
            this.keyBottom = settings.keyBottom || "bottom";
            this.keyLeft = settings.keyLeft || "left";
            this.keyOffsetX = settings.keyOffsetX;
            this.keyOffsetY = settings.keyOffsetY;
            this.generateObjectKey = settings.generateObjectKey || function (thing) {
                return thing.toString();
            };
            this.resetBackground();
        }
        PixelDrawr.prototype.getFramerateSkip = function () {
            return this.framerateSkip;
        };
        PixelDrawr.prototype.getThingArray = function () {
            return this.thingArrays;
        };
        PixelDrawr.prototype.getCanvas = function () {
            return this.canvas;
        };
        PixelDrawr.prototype.getContext = function () {
            return this.context;
        };
        PixelDrawr.prototype.getBackgroundCanvas = function () {
            return this.backgroundCanvas;
        };
        PixelDrawr.prototype.getBackgroundContext = function () {
            return this.backgroundContext;
        };
        PixelDrawr.prototype.getNoRefill = function () {
            return this.noRefill;
        };
        PixelDrawr.prototype.getEpsilon = function () {
            return this.epsilon;
        };
        PixelDrawr.prototype.setFramerateSkip = function (framerateSkip) {
            this.framerateSkip = framerateSkip;
        };
        PixelDrawr.prototype.setThingArrays = function (thingArrays) {
            this.thingArrays = thingArrays;
        };
        PixelDrawr.prototype.setCanvas = function (canvas) {
            this.canvas = canvas;
            this.context = canvas.getContext("2d");
        };
        PixelDrawr.prototype.setNoRefill = function (noRefill) {
            this.noRefill = noRefill;
        };
        PixelDrawr.prototype.setEpsilon = function (epsilon) {
            this.epsilon = epsilon;
        };
        PixelDrawr.prototype.resetBackground = function () {
            this.backgroundCanvas = this.createCanvas(this.MapScreener[this.keyWidth], this.MapScreener[this.keyHeight]);
            this.backgroundContext = this.backgroundCanvas.getContext("2d");
        };
        PixelDrawr.prototype.setBackground = function (fillStyle) {
            this.backgroundContext.fillStyle = fillStyle;
            this.backgroundContext.fillRect(0, 0, this.MapScreener[this.keyWidth], this.MapScreener[this.keyHeight]);
        };
        PixelDrawr.prototype.drawBackground = function () {
            this.context.drawImage(this.backgroundCanvas, 0, 0);
        };
        PixelDrawr.prototype.setThingSprite = function (thing) {
            if (thing.hidden) {
                return;
            }
            thing.sprite = this.PixelRender.decode(this.generateObjectKey(thing), thing);
            if (thing.sprite.constructor === PixelRendr.SpriteMultiple) {
                thing.numSprites = 0;
                this.refillThingCanvasMultiple(thing);
            }
            else {
                thing.numSprites = 1;
                this.refillThingCanvasSingle(thing);
            }
        };
        PixelDrawr.prototype.refillGlobalCanvas = function () {
            this.framesDrawn += 1;
            if (this.framesDrawn % this.framerateSkip !== 0) {
                return;
            }
            if (!this.noRefill) {
                this.drawBackground();
            }
            for (var i = 0; i < this.thingArrays.length; i += 1) {
                this.refillThingArray(this.thingArrays[i]);
            }
        };
        PixelDrawr.prototype.refillThingArray = function (array) {
            for (var i = 0; i < array.length; i += 1) {
                this.drawThingOnContext(this.context, array[i]);
            }
        };
        PixelDrawr.prototype.drawThingOnContext = function (context, thing) {
            if (thing.hidden
                || thing.opacity < this.epsilon
                || thing[this.keyHeight] < 1
                || thing[this.keyWidth] < 1
                || this.getTop(thing) > this.MapScreener[this.keyHeight]
                || this.getRight(thing) < 0
                || this.getBottom(thing) < 0
                || this.getLeft(thing) > this.MapScreener[this.keyWidth]) {
                return;
            }
            if (typeof thing.numSprites === "undefined") {
                this.setThingSprite(thing);
            }
            if (thing.canvas[this.keyWidth] > 0) {
                this.drawThingOnContextSingle(context, thing.canvas, thing, this.getLeft(thing), this.getTop(thing));
            }
            else {
                this.drawThingOnContextMultiple(context, thing.canvases, thing, this.getLeft(thing), this.getTop(thing));
            }
        };
        PixelDrawr.prototype.refillThingCanvasSingle = function (thing) {
            if (thing[this.keyWidth] < 1 || thing[this.keyHeight] < 1) {
                return;
            }
            var canvas = thing.canvas, context = thing.context, imageData = context.getImageData(0, 0, canvas[this.keyWidth], canvas[this.keyHeight]);
            this.PixelRender.memcpyU8(thing.sprite, imageData.data);
            context.putImageData(imageData, 0, 0);
        };
        PixelDrawr.prototype.refillThingCanvasMultiple = function (thing) {
            if (thing[this.keyWidth] < 1 || thing[this.keyHeight] < 1) {
                return;
            }
            var spritesRaw = thing.sprite, canvases = thing.canvases = {
                "direction": spritesRaw.direction,
                "multiple": true
            }, canvas, context, imageData, i;
            thing.numSprites = 1;
            for (i in spritesRaw.sprites) {
                if (!spritesRaw.sprites.hasOwnProperty(i)) {
                    continue;
                }
                canvas = this.createCanvas(thing.spritewidth * this.unitsize, thing.spriteheight * this.unitsize);
                context = canvas.getContext("2d");
                imageData = context.getImageData(0, 0, canvas[this.keyWidth], canvas[this.keyHeight]);
                this.PixelRender.memcpyU8(spritesRaw.sprites[i], imageData.data);
                context.putImageData(imageData, 0, 0);
                canvases[i] = {
                    "canvas": canvas,
                    "context": context
                };
                thing.numSprites += 1;
            }
            if (thing[this.keyWidth] * thing[this.keyHeight] < this.spriteCacheCutoff) {
                thing.canvas[this.keyWidth] = thing[this.keyWidth] * this.unitsize;
                thing.canvas[this.keyHeight] = thing[this.keyHeight] * this.unitsize;
                this.drawThingOnContextMultiple(thing.context, thing.canvases, thing, 0, 0);
            }
            else {
                thing.canvas[this.keyWidth] = thing.canvas[this.keyHeight] = 0;
            }
        };
        PixelDrawr.prototype.drawThingOnContextSingle = function (context, canvas, thing, left, top) {
            if (thing.repeat) {
                this.drawPatternOnContext(context, canvas, left, top, thing.unitwidth, thing.unitheight, thing.opacity || 1);
            }
            else if (thing.opacity !== 1) {
                context.globalAlpha = thing.opacity;
                context.drawImage(canvas, left, top, canvas.width * thing.scale, canvas.height * thing.scale);
                context.globalAlpha = 1;
            }
            else {
                context.drawImage(canvas, left, top, canvas.width * thing.scale, canvas.height * thing.scale);
            }
        };
        PixelDrawr.prototype.drawThingOnContextMultiple = function (context, canvases, thing, left, top) {
            var sprite = thing.sprite, topreal = top, leftreal = left, rightreal = left + thing.unitwidth, bottomreal = top + thing.unitheight, widthreal = thing.unitwidth, heightreal = thing.unitheight, spritewidthpixels = thing.spritewidthpixels, spriteheightpixels = thing.spriteheightpixels, widthdrawn = Math.min(widthreal, spritewidthpixels), heightdrawn = Math.min(heightreal, spriteheightpixels), opacity = thing.opacity, diffhoriz, diffvert, canvasref;
            switch (canvases.direction) {
                case "vertical":
                    if ((canvasref = canvases[this.keyBottom])) {
                        diffvert = sprite.bottomheight ? sprite.bottomheight * this.unitsize : spriteheightpixels;
                        this.drawPatternOnContext(context, canvasref.canvas, leftreal, bottomreal - diffvert, widthreal, heightdrawn, opacity);
                        bottomreal -= diffvert;
                        heightreal -= diffvert;
                    }
                    if ((canvasref = canvases[this.keyTop])) {
                        diffvert = sprite.topheight ? sprite.topheight * this.unitsize : spriteheightpixels;
                        this.drawPatternOnContext(context, canvasref.canvas, leftreal, topreal, widthreal, heightdrawn, opacity);
                        topreal += diffvert;
                        heightreal -= diffvert;
                    }
                    break;
                case "horizontal":
                    if ((canvasref = canvases[this.keyLeft])) {
                        diffhoriz = sprite.leftwidth ? sprite.leftwidth * this.unitsize : spritewidthpixels;
                        this.drawPatternOnContext(context, canvasref.canvas, leftreal, topreal, widthdrawn, heightreal, opacity);
                        leftreal += diffhoriz;
                        widthreal -= diffhoriz;
                    }
                    if ((canvasref = canvases[this.keyRight])) {
                        diffhoriz = sprite.rightwidth ? sprite.rightwidth * this.unitsize : spritewidthpixels;
                        this.drawPatternOnContext(context, canvasref.canvas, rightreal - diffhoriz, topreal, widthdrawn, heightreal, opacity);
                        rightreal -= diffhoriz;
                        widthreal -= diffhoriz;
                    }
                    break;
                case "corners":
                    diffvert = sprite.topheight ? sprite.topheight * this.unitsize : spriteheightpixels;
                    diffhoriz = sprite.leftwidth ? sprite.leftwidth * this.unitsize : spritewidthpixels;
                    this.drawPatternOnContext(context, canvases.topLeft.canvas, leftreal, topreal, widthdrawn, heightdrawn, opacity);
                    this.drawPatternOnContext(context, canvases[this.keyLeft].canvas, leftreal, topreal + diffvert, widthdrawn, heightreal - diffvert * 2, opacity);
                    this.drawPatternOnContext(context, canvases.bottomLeft.canvas, leftreal, bottomreal - diffvert, widthdrawn, heightdrawn, opacity);
                    leftreal += diffhoriz;
                    widthreal -= diffhoriz;
                    diffhoriz = sprite.rightwidth ? sprite.rightwidth * this.unitsize : spritewidthpixels;
                    this.drawPatternOnContext(context, canvases[this.keyTop].canvas, leftreal, topreal, widthreal - diffhoriz, heightdrawn, opacity);
                    this.drawPatternOnContext(context, canvases.topRight.canvas, rightreal - diffhoriz, topreal, widthdrawn, heightdrawn, opacity);
                    topreal += diffvert;
                    heightreal -= diffvert;
                    diffvert = sprite.bottomheight ? sprite.bottomheight * this.unitsize : spriteheightpixels;
                    this.drawPatternOnContext(context, canvases[this.keyRight].canvas, rightreal - diffhoriz, topreal, widthdrawn, heightreal - diffvert, opacity);
                    this.drawPatternOnContext(context, canvases.bottomRight.canvas, rightreal - diffhoriz, bottomreal - diffvert, widthdrawn, heightdrawn, opacity);
                    this.drawPatternOnContext(context, canvases[this.keyBottom].canvas, leftreal, bottomreal - diffvert, widthreal - diffhoriz, heightdrawn, opacity);
                    rightreal -= diffhoriz;
                    widthreal -= diffhoriz;
                    bottomreal -= diffvert;
                    heightreal -= diffvert;
                    break;
                default:
                    throw new Error("Unknown or missing direction given in SpriteMultiple.");
            }
            if ((canvasref = canvases.middle) && topreal < bottomreal && leftreal < rightreal) {
                if (sprite.middleStretch) {
                    context.globalAlpha = opacity;
                    context.drawImage(canvasref.canvas, leftreal, topreal, widthreal, heightreal);
                    context.globalAlpha = 1;
                }
                else {
                    this.drawPatternOnContext(context, canvasref.canvas, leftreal, topreal, widthreal, heightreal, opacity);
                }
            }
        };
        PixelDrawr.prototype.getTop = function (thing) {
            if (this.keyOffsetY) {
                return thing[this.keyTop] + thing[this.keyOffsetY];
            }
            else {
                return thing[this.keyTop];
            }
        };
        PixelDrawr.prototype.getRight = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyRight] + thing[this.keyOffsetX];
            }
            else {
                return thing[this.keyRight];
            }
        };
        PixelDrawr.prototype.getBottom = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyBottom] + thing[this.keyOffsetY];
            }
            else {
                return thing[this.keyBottom];
            }
        };
        PixelDrawr.prototype.getLeft = function (thing) {
            if (this.keyOffsetX) {
                return thing[this.keyLeft] + thing[this.keyOffsetX];
            }
            else {
                return thing[this.keyLeft];
            }
        };
        PixelDrawr.prototype.drawPatternOnContext = function (context, source, left, top, width, height, opacity) {
            context.globalAlpha = opacity;
            context.translate(left, top);
            context.fillStyle = context.createPattern(source, "repeat");
            context.fillRect(0, 0, width, height);
            context.translate(-left, -top);
            context.globalAlpha = 1;
        };
        return PixelDrawr;
    })();
    PixelDrawr_1.PixelDrawr = PixelDrawr;
})(PixelDrawr || (PixelDrawr = {}));
var TimeHandlr;
(function (TimeHandlr) {
    "use strict";
    var TimeEvent = (function () {
        function TimeEvent(callback, repeat, time, timeRepeat, args) {
            this.count = 0;
            this.callback = callback;
            this.repeat = repeat;
            this.timeRepeat = timeRepeat;
            this.time = time + TimeEvent.runCalculator(timeRepeat, this);
            this.args = args;
        }
        TimeEvent.runCalculator = function (value) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (value.constructor === Number) {
                return value;
            }
            else {
                return value.apply(void 0, args);
            }
        };
        TimeEvent.prototype.scheduleNextRepeat = function () {
            return this.time += TimeEvent.runCalculator(this.timeRepeat);
        };
        return TimeEvent;
    })();
    TimeHandlr.TimeEvent = TimeEvent;
})(TimeHandlr || (TimeHandlr = {}));
var TimeHandlr;
(function (TimeHandlr_1) {
    "use strict";
    var TimeHandlr = (function () {
        function TimeHandlr(settings) {
            if (settings === void 0) { settings = {}; }
            this.time = 0;
            this.events = {};
            this.timingDefault = settings.timingDefault || 1;
            this.keyCycles = settings.keyCycles || "cycles";
            this.keyClassName = settings.keyClassName || "className";
            this.keyOnClassCycleStart = settings.keyOnClassCycleStart || "onClassCycleStart";
            this.keyDoClassCycleStart = settings.keyDoClassCycleStart || "doClassCycleStart";
            this.keyCycleCheckValidity = settings.keyCycleCheckValidity;
            this.copyCycleSettings = typeof settings.copyCycleSettings === "undefined" ? true : settings.copyCycleSettings;
            this.classAdd = settings.classAdd || this.classAddGeneric;
            this.classRemove = settings.classRemove || this.classRemoveGeneric;
        }
        TimeHandlr.prototype.getTime = function () {
            return this.time;
        };
        TimeHandlr.prototype.getEvents = function () {
            return this.events;
        };
        TimeHandlr.prototype.addEvent = function (callback, timeDelay) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var event = new TimeHandlr_1.TimeEvent(callback, 1, this.time, timeDelay || 1, args);
            this.insertEvent(event);
            return event;
        };
        TimeHandlr.prototype.addEventInterval = function (callback, timeDelay, numRepeats) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            var event = new TimeHandlr_1.TimeEvent(callback, numRepeats || 1, this.time, timeDelay || 1, args);
            this.insertEvent(event);
            return event;
        };
        TimeHandlr.prototype.addEventIntervalSynched = function (callback, timeDelay, numRepeats) {
            var args = [];
            for (var _i = 3; _i < arguments.length; _i++) {
                args[_i - 3] = arguments[_i];
            }
            timeDelay = timeDelay || 1;
            numRepeats = numRepeats || 1;
            var calcTime = TimeHandlr_1.TimeEvent.runCalculator(timeDelay || this.timingDefault), entryTime = Math.ceil(this.time / calcTime) * calcTime;
            if (entryTime === this.time) {
                return this.addEventInterval.apply(this, [callback, timeDelay, numRepeats].concat(args));
            }
            else {
                return this.addEvent.apply(this, [this.addEventInterval, entryTime - this.time, callback, timeDelay, numRepeats].concat(args));
            }
        };
        TimeHandlr.prototype.addClassCycle = function (thing, settings, name, timing) {
            if (!thing[this.keyCycles]) {
                thing[this.keyCycles] = {};
            }
            this.cancelClassCycle(thing, name);
            settings = thing[this.keyCycles][name || "0"] = this.setClassCycle(thing, settings, timing);
            this.cycleClass(thing, settings);
            return settings;
        };
        TimeHandlr.prototype.addClassCycleSynched = function (thing, settings, name, timing) {
            if (!thing[this.keyCycles]) {
                thing[this.keyCycles] = {};
            }
            this.cancelClassCycle(thing, name);
            settings = thing[this.keyCycles][name || "0"] = this.setClassCycle(thing, settings, timing, true);
            this.cycleClass(thing, settings);
            return settings;
        };
        TimeHandlr.prototype.handleEvents = function () {
            var currentEvents, i;
            this.time += 1;
            currentEvents = this.events[this.time];
            if (!currentEvents) {
                return;
            }
            for (i = 0; i < currentEvents.length; i += 1) {
                this.handleEvent(currentEvents[i]);
            }
            delete this.events[this.time];
        };
        TimeHandlr.prototype.handleEvent = function (event) {
            if (event.repeat <= 0 || event.callback.apply(this, event.args)) {
                return;
            }
            if (typeof event.repeat === "function") {
                if (!event.repeat.apply(this, event.args)) {
                    return;
                }
            }
            else {
                if (!event.repeat) {
                    return;
                }
                event.repeat = event.repeat - 1;
                if (event.repeat <= 0) {
                    return;
                }
            }
            event.scheduleNextRepeat();
            this.insertEvent(event);
            return event.time;
        };
        TimeHandlr.prototype.cancelEvent = function (event) {
            event.repeat = 0;
        };
        TimeHandlr.prototype.cancelAllEvents = function () {
            this.events = {};
        };
        TimeHandlr.prototype.cancelClassCycle = function (thing, name) {
            var cycle;
            if (!thing[this.keyCycles] || !thing[this.keyCycles][name]) {
                return;
            }
            cycle = thing[this.keyCycles][name];
            cycle.event.repeat = 0;
            delete thing[this.keyCycles][name];
        };
        TimeHandlr.prototype.cancelAllCycles = function (thing) {
            var keyCycles = thing[this.keyCycles], cycle, name;
            for (name in keyCycles) {
                if (!keyCycles.hasOwnProperty(name)) {
                    continue;
                }
                cycle = keyCycles[name];
                cycle.length = 1;
                cycle[0] = false;
                delete keyCycles[name];
            }
        };
        TimeHandlr.prototype.setClassCycle = function (thing, settings, timing, synched) {
            var _this = this;
            timing = TimeHandlr_1.TimeEvent.runCalculator(timing || this.timingDefault);
            if (this.copyCycleSettings) {
                settings = this.makeSettingsCopy(settings);
            }
            settings.location = settings.oldclass = -1;
            if (synched) {
                thing[this.keyOnClassCycleStart] = function () {
                    var calcTime = settings.length * timing, entryDelay = Math.ceil(_this.time / calcTime) * calcTime - _this.time, event;
                    if (entryDelay === 0) {
                        event = _this.addEventInterval(_this.cycleClass, timing, Infinity, thing, settings);
                    }
                    else {
                        event = _this.addEvent(_this.addEventInterval, entryDelay, _this.cycleClass, timing, Infinity, thing, settings);
                    }
                    settings.event = event;
                };
            }
            else {
                thing[this.keyOnClassCycleStart] = function () {
                    settings.event = _this.addEventInterval(_this.cycleClass, timing, Infinity, thing, settings);
                };
            }
            if (thing[this.keyDoClassCycleStart]) {
                thing[this.keyOnClassCycleStart]();
            }
            return settings;
        };
        TimeHandlr.prototype.cycleClass = function (thing, settings) {
            if (!thing || !settings || !settings.length || (this.keyCycleCheckValidity && !thing[this.keyCycleCheckValidity])) {
                return true;
            }
            var current, name;
            if (settings.oldclass !== -1 && typeof settings[settings.oldclass] === "string") {
                this.classRemove(thing, settings[settings.oldclass]);
            }
            settings.location = (settings.location += 1) % settings.length;
            current = settings[settings.location];
            if (!current) {
                return false;
            }
            if (current.constructor === Function) {
                name = current(thing, settings);
            }
            else {
                name = current;
            }
            settings.oldclass = settings.location;
            if (typeof name === "string") {
                this.classAdd(thing, name);
                return false;
            }
            else {
                return !!name;
            }
        };
        TimeHandlr.prototype.insertEvent = function (event) {
            if (!this.events[event.time]) {
                this.events[event.time] = [event];
            }
            else {
                this.events[event.time].push(event);
            }
        };
        TimeHandlr.prototype.makeSettingsCopy = function (original) {
            var output = new original.constructor(), i;
            for (i in original) {
                if (original.hasOwnProperty(i)) {
                    output[i] = original[i];
                }
            }
            return output;
        };
        TimeHandlr.prototype.classAddGeneric = function (thing, className) {
            thing[this.keyClassName] += " " + className;
        };
        TimeHandlr.prototype.classRemoveGeneric = function (thing, className) {
            thing[this.keyClassName] = thing[this.keyClassName].replace(className, "");
        };
        return TimeHandlr;
    })();
    TimeHandlr_1.TimeHandlr = TimeHandlr;
})(TimeHandlr || (TimeHandlr = {}));
var LevelEditr;
(function (LevelEditr_1) {
    "use strict";
    var LevelEditr = (function () {
        function LevelEditr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to LevelEditr.");
            }
            if (typeof settings.prethings === "undefined") {
                throw new Error("No prethings given to LevelEditr.");
            }
            if (typeof settings.thingGroups === "undefined") {
                throw new Error("No thingGroups given to LevelEditr.");
            }
            if (typeof settings.things === "undefined") {
                throw new Error("No things given to LevelEditr.");
            }
            if (typeof settings.macros === "undefined") {
                throw new Error("No macros given to LevelEditr.");
            }
            if (typeof settings.beautifier === "undefined") {
                throw new Error("No beautifier given to LevelEditr.");
            }
            this.enabled = false;
            this.GameStarter = settings.GameStarter;
            this.prethings = settings.prethings;
            this.thingGroups = settings.thingGroups;
            this.things = settings.things;
            this.macros = settings.macros;
            this.beautifier = settings.beautifier;
            this.mapNameDefault = settings.mapNameDefault || "New Map";
            this.mapTimeDefault = settings.mapTimeDefault || Infinity;
            this.mapSettingDefault = settings.mapSettingDefault || "";
            this.mapEntrances = settings.mapEntrances || [];
            this.mapDefault = settings.mapDefault;
            this.blocksize = settings.blocksize || 1;
            this.keyUndefined = settings.keyUndefined || "-none-";
            this.currentPreThings = [];
            this.currentMode = "Build";
            this.currentClickMode = "Thing";
            this.canClick = true;
        }
        LevelEditr.prototype.getEnabled = function () {
            return this.enabled;
        };
        LevelEditr.prototype.getGameStarter = function () {
            return this.GameStarter;
        };
        LevelEditr.prototype.getOldInformation = function () {
            return this.oldInformation;
        };
        LevelEditr.prototype.getPreThings = function () {
            return this.prethings;
        };
        LevelEditr.prototype.getThingGroups = function () {
            return this.thingGroups;
        };
        LevelEditr.prototype.getThings = function () {
            return this.things;
        };
        LevelEditr.prototype.getMacros = function () {
            return this.macros;
        };
        LevelEditr.prototype.getMapNameDefault = function () {
            return this.mapNameDefault;
        };
        LevelEditr.prototype.getMapTimeDefault = function () {
            return this.mapTimeDefault;
        };
        LevelEditr.prototype.getMapDefault = function () {
            return this.mapDefault;
        };
        LevelEditr.prototype.getDisplay = function () {
            return this.display;
        };
        LevelEditr.prototype.getCurrentMode = function () {
            return this.currentMode;
        };
        LevelEditr.prototype.getBlockSize = function () {
            return this.blocksize;
        };
        LevelEditr.prototype.getBeautifier = function () {
            return this.beautifier;
        };
        LevelEditr.prototype.getCurrentPreThings = function () {
            return this.currentPreThings;
        };
        LevelEditr.prototype.getCurrentTitle = function () {
            return this.currentTitle;
        };
        LevelEditr.prototype.getCurrentArgs = function () {
            return this.currentArgs;
        };
        LevelEditr.prototype.getPageStylesAdded = function () {
            return this.pageStylesAdded;
        };
        LevelEditr.prototype.getKeyUndefined = function () {
            return this.keyUndefined;
        };
        LevelEditr.prototype.getCanClick = function () {
            return this.canClick;
        };
        LevelEditr.prototype.enable = function () {
            if (this.enabled) {
                return;
            }
            this.enabled = true;
            this.oldInformation = {
                "map": this.GameStarter.AreaSpawner.getMapName()
            };
            this.clearAllThings();
            this.resetDisplay();
            this.setCurrentMode("Build");
            this.GameStarter.MapScreener.nokeys = true;
            this.setTextareaValue(this.stringifySmart(this.mapDefault), true);
            this.resetDisplayMap();
            this.disableAllThings();
            this.GameStarter.ItemsHolder.setItem("lives", Infinity);
            if (!this.pageStylesAdded) {
                this.GameStarter.addPageStyles(this.createPageStyles());
                this.pageStylesAdded = true;
            }
            this.GameStarter.container.insertBefore(this.display.container, this.GameStarter.container.children[0]);
        };
        LevelEditr.prototype.disable = function () {
            if (!this.display || !this.enabled) {
                return;
            }
            this.GameStarter.container.removeChild(this.display.container);
            this.display = undefined;
            this.GameStarter.setMap(this.oldInformation.map);
            this.GameStarter.ItemsHolder.setItem("lives", this.GameStarter.settings.statistics.values.lives.valueDefault);
            this.enabled = false;
        };
        LevelEditr.prototype.minimize = function () {
            this.display.minimizer.innerText = "+";
            this.display.minimizer.onclick = this.maximize.bind(this);
            this.display.container.className += " minimized";
            this.display.scrollers.container.style.opacity = "0";
        };
        LevelEditr.prototype.maximize = function () {
            this.display.minimizer.innerText = "-";
            this.display.minimizer.onclick = this.minimize.bind(this);
            if (this.display.container.className.indexOf("minimized") !== -1) {
                this.display.container.className = this.display.container.className.replace(/ minimized/g, "");
            }
            if (this.currentClickMode === "Thing") {
                this.setSectionClickToPlaceThings();
            }
            else if (this.currentClickMode === "Macro") {
                this.setSectionClickToPlaceMacros();
            }
            this.display.scrollers.container.style.opacity = "1";
        };
        LevelEditr.prototype.startBuilding = function () {
            this.setCurrentMode("Build");
            this.beautifyTextareaValue();
            this.setDisplayMap(true);
            this.maximize();
        };
        LevelEditr.prototype.startPlaying = function () {
            this.setCurrentMode("Play");
            this.beautifyTextareaValue();
            this.setDisplayMap();
            this.minimize();
        };
        LevelEditr.prototype.downloadCurrentJSON = function () {
            var link = this.downloadFile(this.getMapName() + ".json", this.display.stringer.textarea.value || "");
            window.open(link.href);
        };
        LevelEditr.prototype.setCurrentJSON = function (json) {
            this.startBuilding();
            this.setTextareaValue(json, true);
            this.getMapObjectAndTry();
        };
        LevelEditr.prototype.loadCurrentJSON = function () {
            this.display.inputDummy.click();
        };
        LevelEditr.prototype.beautify = function (text) {
            return this.beautifier(text);
        };
        LevelEditr.prototype.handleUploadCompletion = function (event) {
            this.enable();
            this.setCurrentJSON(event.currentTarget.result);
            this.setSectionJSON();
        };
        LevelEditr.prototype.setCurrentMode = function (mode) {
            this.currentMode = mode;
        };
        LevelEditr.prototype.setCurrentClickMode = function (mode, event) {
            this.currentClickMode = mode;
            this.cancelEvent(event);
        };
        LevelEditr.prototype.setCurrentThing = function (title, x, y) {
            if (x === void 0) { x = 0; }
            if (y === void 0) { y = 0; }
            var args = this.generateCurrentArgs(), description = this.things[title], reference = this.GameStarter.proliferate({
                "outerok": 2
            }, this.getNormalizedThingArguments(args)), thing = this.GameStarter.ObjectMaker.make(this.currentTitle, reference);
            this.clearCurrentThings();
            this.currentTitle = title;
            this.currentArgs = args;
            this.currentPreThings = [
                {
                    "xloc": 0,
                    "yloc": 0,
                    "top": -description.offsetTop || 0,
                    "right": (description.offsetLeft) + thing.width * this.GameStarter.unitsize,
                    "bottom": (-description.offsetTop || 0) + thing.height * this.GameStarter.unitsize,
                    "left": description.offsetLeft || 0,
                    "title": this.currentTitle,
                    "reference": reference,
                    "thing": thing,
                    "spawned": true
                }
            ];
            this.addThingAndDisableEvents(this.currentPreThings[0].thing, x, y);
        };
        LevelEditr.prototype.resetCurrentThings = function (event) {
            var currentThing, i;
            for (i = 0; i < this.currentPreThings.length; i += 1) {
                currentThing = this.currentPreThings[i];
                currentThing.thing.outerok = 2;
                this.GameStarter.addThing(currentThing.thing, currentThing.xloc || 0, currentThing.yloc || 0);
                this.disableThing(currentThing.thing);
            }
            this.onMouseMoveEditing(event);
            this.GameStarter.TimeHandler.cancelAllEvents();
        };
        LevelEditr.prototype.clearCurrentThings = function () {
            if (!this.currentPreThings) {
                return;
            }
            for (var i = 0; i < this.currentPreThings.length; i += 1) {
                this.GameStarter.killNormal(this.currentPreThings[i].thing);
            }
            this.currentPreThings = [];
        };
        LevelEditr.prototype.setCurrentArgs = function (event) {
            if (this.currentClickMode === "Thing") {
                this.setCurrentThing(this.currentTitle);
            }
            else if (this.currentClickMode === "Macro") {
                this.onMacroIconClick(this.currentTitle, undefined, this.generateCurrentArgs(), event);
            }
            if (event) {
                event.stopPropagation();
            }
        };
        LevelEditr.prototype.onMouseDownScrolling = function (direction, event) {
            var target = event.target, scope = this;
            target.setAttribute("scrolling", "1");
            this.GameStarter.TimeHandler.addEventInterval(function () {
                if (target.getAttribute("scrolling") !== "1") {
                    return true;
                }
                if (direction < 0 && scope.GameStarter.MapScreener.left <= 0) {
                    (scope.display.scrollers.left).style.opacity = ".14";
                    return;
                }
                for (var i = 0; i < scope.currentPreThings.length; i += 1) {
                    scope.GameStarter.shiftHoriz(scope.currentPreThings[i].thing, direction);
                }
                scope.GameStarter.scrollWindow(direction);
                scope.display.scrollers.left.style.opacity = "1";
            }, 1, Infinity);
        };
        LevelEditr.prototype.onMouseUpScrolling = function (event) {
            event.target.setAttribute("scrolling", "0");
        };
        LevelEditr.prototype.onMouseMoveEditing = function (event) {
            var x = event.x || event.clientX || 0, y = event.y || event.clientY || 0, prething, left, top, i;
            for (i = 0; i < this.currentPreThings.length; i += 1) {
                prething = this.currentPreThings[i];
                left = this.roundTo(x - this.GameStarter.container.offsetLeft, this.blocksize);
                top = this.roundTo(y - this.GameStarter.container.offsetTop, this.blocksize);
                if (prething.left) {
                    left += prething.left * this.GameStarter.unitsize;
                }
                if (prething.top) {
                    top -= prething.top * this.GameStarter.unitsize;
                }
                this.GameStarter.setLeft(prething.thing, left);
                this.GameStarter.setTop(prething.thing, top);
            }
        };
        LevelEditr.prototype.afterClick = function () {
            this.canClick = false;
            setTimeout((function () {
                this.canClick = true;
            }).bind(this), 70);
        };
        LevelEditr.prototype.onClickEditingThing = function (event) {
            if (!this.canClick || this.currentMode !== "Build" || !this.currentPreThings.length) {
                return;
            }
            var coordinates = this.getNormalizedMouseEventCoordinates(event, true), x = coordinates[0], y = coordinates[1];
            if (!this.addMapCreationThing(x, y)) {
                return;
            }
            this.onClickEditingGenericAdd(x, y, this.currentTitle, this.currentArgs);
            this.afterClick();
        };
        LevelEditr.prototype.onClickEditingMacro = function (event) {
            if (!this.canClick || this.currentMode !== "Build" || !this.currentPreThings.length) {
                return;
            }
            var coordinates = this.getNormalizedMouseEventCoordinates(event), x = coordinates[0], y = coordinates[1], prething, i;
            if (!this.addMapCreationMacro(x, y)) {
                return;
            }
            for (i = 0; i < this.currentPreThings.length; i += 1) {
                prething = this.currentPreThings[i];
                this.onClickEditingGenericAdd(x + (prething.left || 0) * this.GameStarter.unitsize, y - (prething.top || 0) * this.GameStarter.unitsize, prething.thing.title || prething.title, prething.reference);
            }
            this.afterClick();
        };
        LevelEditr.prototype.onClickEditingGenericAdd = function (x, y, title, args) {
            var thing = this.GameStarter.ObjectMaker.make(title, this.GameStarter.proliferate({
                "onThingMake": undefined,
                "onThingAdd": undefined,
                "onThingAdded": undefined,
                "movement": undefined
            }, this.getNormalizedThingArguments(args))), left = x - this.GameStarter.container.offsetLeft, top = y - this.GameStarter.container.offsetTop;
            if (this.currentMode === "Build") {
                this.disableThing(thing);
            }
            this.addThingAndDisableEvents(thing, left, top);
        };
        LevelEditr.prototype.onThingIconClick = function (title, event) {
            var x = event.x || event.clientX || 0, y = event.y || event.clientY || 0, target = event.target.nodeName === "DIV"
                ? event.target
                : event.target.parentNode;
            this.cancelEvent(event);
            this.killCurrentPreThings();
            this.setVisualOptions(target.getAttribute("name"), undefined, target.options);
            this.generateCurrentArgs();
            this.setCurrentThing(title, x, y);
        };
        LevelEditr.prototype.onMacroIconClick = function (title, description, options, event) {
            if (description) {
                this.setVisualOptions(title, description, options);
            }
            var map = this.getMapObject();
            if (!map) {
                return;
            }
            this.clearCurrentThings();
            this.GameStarter.MapsCreator.analyzePreMacro(this.GameStarter.proliferate({
                "macro": title,
                "x": 0,
                "y": 0
            }, this.generateCurrentArgs()), this.createPrethingsHolder(this.currentPreThings), this.getCurrentAreaObject(map), map);
            this.currentTitle = title;
            this.resetCurrentThings(event);
        };
        LevelEditr.prototype.createPrethingsHolder = function (prethings) {
            var output = {};
            this.thingGroups.forEach(function (group) {
                output[group] = prethings;
            });
            return output;
        };
        LevelEditr.prototype.generateCurrentArgs = function () {
            var args = {}, container = this.display.sections.ClickToPlace.VisualOptions, children = container.getElementsByClassName("VisualOptionsList"), child, labeler, valuer, value, i;
            this.currentArgs = args;
            if (children.length === 0) {
                return args;
            }
            children = children[0].childNodes;
            for (i = 0; i < children.length; i += 1) {
                child = children[i];
                labeler = child.querySelector(".VisualOptionLabel");
                valuer = child.querySelector(".VisualOptionValue");
                switch ((valuer.getAttribute("data:type") || valuer.type).toLowerCase()) {
                    case "boolean":
                        value = valuer.value === "true";
                        break;
                    case "number":
                        value = (Number(valuer.value) || 0) * (Number(valuer.getAttribute("data:mod")) || 1);
                        break;
                    default:
                        if (valuer.getAttribute("typeReal") === "Number") {
                            value = Number(valuer.value);
                        }
                        else {
                            value = valuer.value;
                        }
                        break;
                }
                if (value !== this.keyUndefined) {
                    args[labeler.textContent] = value;
                }
            }
            return args;
        };
        LevelEditr.prototype.setMapName = function () {
            var name = this.getMapName(), map = this.getMapObject();
            if (map && map.name !== name) {
                map.name = name;
                this.display.namer.value = name;
                this.setTextareaValue(this.stringifySmart(map), true);
                this.GameStarter.ItemsHolder.setItem("world", name);
            }
        };
        LevelEditr.prototype.setMapTime = function (fromGui) {
            var map = this.getMapObject(), time;
            if (!map) {
                return;
            }
            if (fromGui) {
                time = Number(this.display.sections.MapSettings.Time.value);
                map.time = time;
            }
            else {
                time = map.time;
                this.display.sections.MapSettings.Time.value = time.toString();
            }
            this.setTextareaValue(this.stringifySmart(map), true);
            this.GameStarter.ItemsHolder.setItem("time", time);
            this.GameStarter.TimeHandler.cancelAllEvents();
        };
        LevelEditr.prototype.setMapSetting = function (fromGui, event) {
            var map = this.getMapObject(), area, setting;
            if (!map) {
                return;
            }
            area = this.getCurrentAreaObject(map);
            if (fromGui) {
                setting = this.display.sections.MapSettings.Setting.Primary.value;
                if (this.display.sections.MapSettings.Setting.Secondary.value) {
                    setting += " " + this.display.sections.MapSettings.Setting.Secondary.value;
                }
                if (this.display.sections.MapSettings.Setting.Tertiary.value) {
                    setting += " " + this.display.sections.MapSettings.Setting.Tertiary.value;
                }
                area.setting = setting;
            }
            else {
                setting = area.setting.split(" ");
                this.display.sections.MapSettings.Setting.Primary.value = setting[0];
                this.display.sections.MapSettings.Setting.Secondary.value = setting[1];
                this.display.sections.MapSettings.Setting.Tertiary.value = setting[2];
            }
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
            this.resetCurrentThings(event);
        };
        LevelEditr.prototype.setLocationArea = function () {
            var map = this.getMapObject(), location;
            if (!map) {
                return;
            }
            location = this.getCurrentLocationObject(map);
            location.area = this.getCurrentArea();
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.setMapEntry = function (fromGui) {
            var map = this.getMapObject(), location, entry;
            if (!map) {
                return;
            }
            location = this.getCurrentLocationObject(map);
            if (fromGui) {
                entry = this.display.sections.MapSettings.Entry.value;
                location.entry = entry;
            }
            else {
                this.display.sections.MapSettings.Entry.value = entry;
            }
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.setCurrentLocation = function () {
            var map = this.getMapObject(), location;
            if (!map) {
                return;
            }
            location = this.getCurrentLocationObject(map);
            this.display.sections.MapSettings.Area.value = location.area
                ? location.area.toString() : "0";
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.addLocationToMap = function () {
            var name = this.display.sections.MapSettings.Location.options.length.toString(), map = this.getMapObject();
            if (!map) {
                return;
            }
            map.locations[name] = {
                "entry": this.mapEntrances[0]
            };
            this.resetAllVisualOptionSelects("VisualOptionLocation", Object.keys(map.locations));
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.addAreaToMap = function () {
            var name = this.display.sections.MapSettings.Area.options.length.toString(), map = this.getMapObject();
            if (!map) {
                return;
            }
            map.areas[name] = {
                "setting": this.mapSettingDefault,
                "creation": []
            };
            this.resetAllVisualOptionSelects("VisualOptionArea", Object.keys(map.areas));
            this.setTextareaValue(this.stringifySmart(map), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.resetAllVisualOptionSelects = function (className, options) {
            var map = this.getMapObject(), elements = this.display.container.getElementsByClassName(className), attributes = {
                "children": options.map(function (option) {
                    return new Option(option, option);
                })
            }, element, value, i;
            if (!map) {
                return;
            }
            for (i = 0; i < elements.length; i += 1) {
                element = elements[i];
                value = element.value;
                element.textContent = "";
                this.GameStarter.proliferateElement(element, attributes);
                element.value = value;
            }
        };
        LevelEditr.prototype.getMapObject = function () {
            var map;
            try {
                map = this.parseSmart(this.display.stringer.textarea.value);
                this.display.stringer.messenger.textContent = "";
                this.display.namer.value = map.name || this.mapNameDefault;
            }
            catch (error) {
                this.setSectionJSON();
                this.display.stringer.messenger.textContent = error.message;
            }
            return map;
        };
        LevelEditr.prototype.getMapObjectAndTry = function (event) {
            var mapName = this.getMapName() + "::Temporary", mapRaw = this.getMapObject();
            if (!mapRaw) {
                return;
            }
            try {
                this.GameStarter.MapsCreator.storeMap(mapName, mapRaw);
                this.GameStarter.MapsCreator.getMap(mapName);
                this.setDisplayMap(true);
            }
            catch (error) {
                this.display.stringer.messenger.textContent = error.message;
            }
            if (event) {
                event.stopPropagation();
            }
        };
        LevelEditr.prototype.getCurrentArea = function () {
            return this.display.sections.MapSettings.Area.value;
        };
        LevelEditr.prototype.getCurrentAreaObject = function (map) {
            if (map === void 0) { map = this.getMapObject(); }
            var area = map.locations[this.getCurrentLocation()].area;
            return map.areas[area ? area.toString() : "0"];
        };
        LevelEditr.prototype.getCurrentLocation = function () {
            return this.display.sections.MapSettings.Location.value;
        };
        LevelEditr.prototype.getCurrentLocationObject = function (map) {
            return map.locations[this.getCurrentLocation()];
        };
        LevelEditr.prototype.addMapCreationThing = function (x, y) {
            var mapObject = this.getMapObject(), thingRaw = this.GameStarter.proliferate({
                "thing": this.currentTitle,
                "x": this.getNormalizedX(x) + (this.GameStarter.MapScreener.left / this.GameStarter.unitsize),
                "y": this.getNormalizedY(y)
            }, this.currentArgs);
            if (!mapObject) {
                return false;
            }
            mapObject.areas[this.getCurrentArea()].creation.push(thingRaw);
            this.setTextareaValue(this.stringifySmart(mapObject), true);
            return true;
        };
        LevelEditr.prototype.addMapCreationMacro = function (x, y) {
            var mapObject = this.getMapObject(), macroRaw = this.GameStarter.proliferate({
                "macro": this.currentTitle,
                "x": this.getNormalizedX(x) + (this.GameStarter.MapScreener.left / this.GameStarter.unitsize),
                "y": this.getNormalizedY(y)
            }, this.generateCurrentArgs());
            if (!mapObject) {
                return false;
            }
            mapObject.areas[this.getCurrentArea()].creation.push(macroRaw);
            this.setTextareaValue(this.stringifySmart(mapObject), true);
            return true;
        };
        LevelEditr.prototype.resetDisplay = function () {
            this.display = {
                "container": this.GameStarter.createElement("div", {
                    "className": "LevelEditor",
                    "onclick": this.cancelEvent.bind(this),
                    "ondragenter": this.handleDragEnter.bind(this),
                    "ondragover": this.handleDragOver.bind(this),
                    "ondrop": this.handleDragDrop.bind(this)
                }),
                "scrollers": {},
                "stringer": {},
                "sections": {
                    "ClickToPlace": {},
                    "MapSettings": {
                        "Setting": {}
                    },
                    "buttons": {
                        "ClickToPlace": {}
                    }
                }
            };
            this.resetDisplayScrollers();
            this.resetDisplayGui();
            this.resetDisplayHead();
            this.resetDisplaySectionChoosers();
            this.resetDisplayOptionsList();
            this.resetDisplayMapSettings();
            setTimeout(this.resetDisplayThinCheck.bind(this));
        };
        LevelEditr.prototype.resetDisplayThinCheck = function () {
            var width = this.display.gui.clientWidth;
            if (width <= 385) {
                this.display.container.className += " thin";
            }
            else if (width >= 560) {
                this.display.container.className += " thick";
            }
        };
        LevelEditr.prototype.resetDisplayGui = function () {
            this.display.gui = this.GameStarter.createElement("div", {
                "className": "EditorGui"
            });
            this.display.container.appendChild(this.display.gui);
        };
        LevelEditr.prototype.resetDisplayScrollers = function () {
            this.display.scrollers = {
                "left": this.GameStarter.createElement("div", {
                    "className": "EditorScroller EditorScrollerLeft",
                    "onmousedown": this.onMouseDownScrolling.bind(this, -this.GameStarter.unitsize * 2),
                    "onmouseup": this.onMouseUpScrolling.bind(this),
                    "onmouseout": this.onMouseUpScrolling.bind(this),
                    "onclick": this.cancelEvent.bind(this),
                    "innerText": "<",
                    "style": {
                        "opacity": .14
                    }
                }),
                "right": this.GameStarter.createElement("div", {
                    "className": "EditorScroller EditorScrollerRight",
                    "onmousedown": this.onMouseDownScrolling.bind(this, this.GameStarter.unitsize * 2),
                    "onmouseup": this.onMouseUpScrolling.bind(this),
                    "onmouseout": this.onMouseUpScrolling.bind(this),
                    "onclick": this.cancelEvent.bind(this),
                    "innerText": ">"
                }),
                "container": this.GameStarter.createElement("div", {
                    "className": "EditorScrollers",
                    "onmousemove": this.onMouseMoveEditing.bind(this),
                    "onclick": this.onClickEditingThing.bind(this)
                })
            };
            this.display.scrollers.container.appendChild(this.display.scrollers.left);
            this.display.scrollers.container.appendChild(this.display.scrollers.right);
            this.display.container.appendChild(this.display.scrollers.container);
        };
        LevelEditr.prototype.resetDisplayHead = function () {
            this.display.minimizer = this.GameStarter.createElement("div", {
                "className": "EditorHeadButton EditorMinimizer",
                "onclick": this.minimize.bind(this),
                "textContent": "-"
            });
            this.display.head = this.GameStarter.createElement("div", {
                "className": "EditorHead",
                "children": [
                    this.GameStarter.createElement("div", {
                        "className": "EditorNameContainer",
                        "children": [
                            this.display.namer = this.GameStarter.createElement("input", {
                                "className": "EditorNameInput",
                                "type": "text",
                                "placeholder": this.mapNameDefault,
                                "value": this.mapNameDefault,
                                "onkeyup": this.setMapName.bind(this),
                                "onchange": this.setMapName.bind(this)
                            })
                        ]
                    }),
                    this.display.minimizer,
                    this.GameStarter.createElement("div", {
                        "className": "EditorHeadButton EditorCloser",
                        "textContent": "X",
                        "onclick": this.disable.bind(this)
                    })
                ]
            });
            this.display.gui.appendChild(this.display.head);
        };
        LevelEditr.prototype.resetDisplaySectionChoosers = function () {
            var sectionChoosers = this.GameStarter.createElement("div", {
                "className": "EditorSectionChoosers",
                "onclick": this.cancelEvent.bind(this),
                "children": [
                    this.display.sections.buttons.ClickToPlace.container = this.GameStarter.createElement("div", {
                        "className": "EditorMenuOption EditorSectionChooser EditorMenuOptionThird",
                        "style": {
                            "background": "white"
                        },
                        "textContent": "Visual",
                        "onclick": this.setSectionClickToPlace.bind(this)
                    }),
                    this.display.sections.buttons.MapSettings = this.GameStarter.createElement("div", {
                        "className": "EditorMenuOption EditorSectionChooser EditorMenuOptionThird",
                        "style": {
                            "background": "gray"
                        },
                        "textContent": "Map",
                        "onclick": this.setSectionMapSettings.bind(this)
                    }),
                    this.display.sections.buttons.JSON = this.GameStarter.createElement("div", {
                        "className": "EditorMenuOption EditorSectionChooser EditorMenuOptionThird",
                        "style": {
                            "background": "gray"
                        },
                        "textContent": "JSON",
                        "onclick": this.setSectionJSON.bind(this)
                    })
                ]
            });
            this.display.gui.appendChild(sectionChoosers);
        };
        LevelEditr.prototype.resetDisplayOptionsList = function () {
            this.display.sections.ClickToPlace.container = this.GameStarter.createElement("div", {
                "className": "EditorOptionsList EditorSectionMain",
                "onclick": this.cancelEvent.bind(this)
            });
            this.resetDisplayOptionsListSubOptionsMenu();
            this.resetDisplayOptionsListSubOptions();
            this.display.gui.appendChild(this.display.sections.ClickToPlace.container);
        };
        LevelEditr.prototype.resetDisplayOptionsListSubOptionsMenu = function () {
            var holder = this.GameStarter.createElement("div", {
                "className": "EditorSubOptionsListsMenu"
            });
            this.display.sections.buttons.ClickToPlace.Things = this.GameStarter.createElement("div", {
                "className": "EditorMenuOption EditorSubOptionsListChooser EditorMenuOptionHalf",
                "textContent": "Things",
                "onclick": this.setSectionClickToPlaceThings.bind(this),
                "style": {
                    "background": "#CCC"
                }
            });
            this.display.sections.buttons.ClickToPlace.Macros = this.GameStarter.createElement("div", {
                "className": "EditorMenuOption EditorSubOptionsListChooser EditorMenuOptionHalf",
                "textContent": "Macros",
                "onclick": this.setSectionClickToPlaceMacros.bind(this),
                "style": {
                    "background": "#777"
                }
            });
            holder.appendChild(this.display.sections.buttons.ClickToPlace.Things);
            holder.appendChild(this.display.sections.buttons.ClickToPlace.Macros);
            this.display.sections.ClickToPlace.container.appendChild(holder);
        };
        LevelEditr.prototype.resetDisplayMapSettings = function () {
            this.display.sections.MapSettings.container = this.GameStarter.createElement("div", {
                "className": "EditorMapSettings EditorSectionMain",
                "onclick": this.cancelEvent.bind(this),
                "style": {
                    "display": "none"
                },
                "children": [
                    this.GameStarter.createElement("div", {
                        "className": "EditorMenuOption",
                        "textContent": "+ Add Area",
                        "onclick": this.addAreaToMap.bind(this)
                    }),
                    this.GameStarter.createElement("div", {
                        "className": "EditorMenuOption",
                        "textContent": "+ Add Location",
                        "onclick": this.addLocationToMap.bind(this)
                    })
                ]
            });
            this.resetDisplayMapSettingsCurrent();
            this.resetDisplayMapSettingsMap();
            this.resetDisplayMapSettingsArea();
            this.resetDisplayMapSettingsLocation();
            this.resetDisplayJSON();
            this.resetDisplayVisualContainers();
            this.resetDisplayButtons();
            this.display.gui.appendChild(this.display.sections.MapSettings.container);
        };
        LevelEditr.prototype.resetDisplayMapSettingsCurrent = function () {
            this.display.sections.MapSettings.container.appendChild(this.GameStarter.createElement("div", {
                "className": "EditorMapSettingsSubGroup",
                "children": [
                    this.GameStarter.createElement("label", {
                        "textContent": "Current Location"
                    }),
                    this.display.sections.MapSettings.Location = this.createSelect(["0"], {
                        "className": "VisualOptionLocation",
                        "onchange": this.setCurrentLocation.bind(this)
                    })
                ]
            }));
        };
        LevelEditr.prototype.resetDisplayMapSettingsMap = function () {
            this.display.sections.MapSettings.container.appendChild(this.GameStarter.createElement("div", {
                "className": "EditorMapSettingsGroup",
                "children": [
                    this.GameStarter.createElement("h4", {
                        "textContent": "Map"
                    }),
                    this.GameStarter.createElement("div", {
                        "className": "EditorMapSettingsSubGroup",
                        "children": [
                            this.GameStarter.createElement("label", {
                                "className": "EditorMapSettingsLabel",
                                "textContent": "Time"
                            }),
                            this.display.sections.MapSettings.Time = this.createSelect([
                                "100", "200", "300", "400", "500", "1000", "Infinity"
                            ], {
                                "value": this.mapTimeDefault.toString(),
                                "onchange": this.setMapTime.bind(this, true)
                            })
                        ]
                    })
                ]
            }));
        };
        LevelEditr.prototype.resetDisplayMapSettingsArea = function () {
            this.display.sections.MapSettings.container.appendChild(this.GameStarter.createElement("div", {
                "className": "EditorMapSettingsGroup",
                "children": [
                    this.GameStarter.createElement("h4", {
                        "textContent": "Area"
                    }),
                    this.GameStarter.createElement("div", {
                        "className": "EditorMapSettingsSubGroup",
                        "children": [
                            this.GameStarter.createElement("label", {
                                "textContent": "Setting"
                            }),
                            this.display.sections.MapSettings.Setting.Primary = this.createSelect([
                                "Overworld", "Underworld", "Underwater", "Castle"
                            ], {
                                "onchange": this.setMapSetting.bind(this, true)
                            }),
                            this.display.sections.MapSettings.Setting.Secondary = this.createSelect([
                                "", "Night", "Underwater", "Alt"
                            ], {
                                "onchange": this.setMapSetting.bind(this, true)
                            }),
                            this.display.sections.MapSettings.Setting.Tertiary = this.createSelect([
                                "", "Night", "Underwater", "Alt"
                            ], {
                                "onchange": this.setMapSetting.bind(this, true)
                            })
                        ]
                    })
                ]
            }));
        };
        LevelEditr.prototype.resetDisplayMapSettingsLocation = function () {
            this.display.sections.MapSettings.container.appendChild(this.GameStarter.createElement("div", {
                "className": "EditorMapSettingsGroup",
                "children": [
                    this.GameStarter.createElement("h4", {
                        "textContent": "Location"
                    }),
                    this.GameStarter.createElement("div", {
                        "className": "EditorMapSettingsSubGroup",
                        "children": [
                            this.GameStarter.createElement("label", {
                                "textContent": "Area"
                            }),
                            this.display.sections.MapSettings.Area = this.createSelect(["0"], {
                                "className": "VisualOptionArea",
                                "onchange": this.setLocationArea.bind(this, true)
                            })
                        ]
                    }),
                    this.GameStarter.createElement("div", {
                        "className": "EditorMapSettingsSubGroup",
                        "children": [
                            this.GameStarter.createElement("label", {
                                "textContent": "Entrance"
                            }),
                            this.display.sections.MapSettings.Entry = this.createSelect(this.mapEntrances, {
                                "onchange": this.setMapEntry.bind(this, true)
                            })
                        ]
                    })
                ]
            }));
        };
        LevelEditr.prototype.resetDisplayJSON = function () {
            this.display.sections.JSON = this.GameStarter.createElement("div", {
                "className": "EditorJSON EditorSectionMain",
                "onclick": this.cancelEvent.bind(this),
                "style": {
                    "display": "none"
                },
                "children": [
                    this.display.stringer.textarea = this.GameStarter.createElement("textarea", {
                        "className": "EditorJSONInput",
                        "spellcheck": false,
                        "onkeyup": this.getMapObjectAndTry.bind(this),
                        "onchange": this.getMapObjectAndTry.bind(this),
                        "onkeydown": function (event) {
                            event.stopPropagation();
                        }
                    }),
                    this.display.stringer.messenger = this.GameStarter.createElement("div", {
                        "className": "EditorJSONInfo"
                    })
                ]
            });
            this.display.gui.appendChild(this.display.sections.JSON);
        };
        LevelEditr.prototype.resetDisplayVisualContainers = function () {
            this.display.sections.ClickToPlace.VisualOptions = this.GameStarter.createElement("div", {
                "textContent": "Click an icon to view options.",
                "className": "EditorVisualOptions",
                "onclick": this.cancelEvent.bind(this)
            });
            this.display.gui.appendChild(this.display.sections.ClickToPlace.VisualOptions);
        };
        LevelEditr.prototype.resetDisplayButtons = function () {
            var scope = this;
            this.display.gui.appendChild(this.GameStarter.createElement("div", {
                "className": "EditorMenu",
                "onclick": this.cancelEvent.bind(this),
                "children": (function (actions) {
                    return Object.keys(actions).map(function (key) {
                        return scope.GameStarter.createElement("div", {
                            "className": "EditorMenuOption EditorMenuOptionFifth EditorMenuOption-" + key,
                            "textContent": key,
                            "onclick": actions[key][0].bind(scope),
                            "children": actions[key][1]
                        });
                    });
                })({
                    "Build": [this.startBuilding.bind(this)],
                    "Play": [this.startPlaying.bind(this)],
                    "Save": [this.downloadCurrentJSON.bind(this)],
                    "Load": [
                        this.loadCurrentJSON.bind(this),
                        this.display.inputDummy = this.GameStarter.createElement("input", {
                            "type": "file",
                            "style": {
                                "display": "none"
                            },
                            "onchange": this.handleUploadStart.bind(this)
                        })
                    ],
                    "Reset": [this.resetDisplayMap.bind(this)]
                })
            }));
        };
        LevelEditr.prototype.resetDisplayOptionsListSubOptions = function () {
            this.resetDisplayOptionsListSubOptionsThings();
            this.resetDisplayOptionsListSubOptionsMacros();
        };
        LevelEditr.prototype.resetDisplayOptionsListSubOptionsThings = function () {
            var scope = this, argumentGetter = this.getPrethingSizeArguments.bind(this), clicker = this.onThingIconClick;
            if (this.display.sections.ClickToPlace.Things) {
                this.display.sections.ClickToPlace.container.removeChild(this.display.sections.ClickToPlace.Things);
            }
            this.display.sections.ClickToPlace.Things = this.GameStarter.createElement("div", {
                "className": "EditorSectionSecondary EditorOptions EditorOptions-Things",
                "style": {
                    "display": "block"
                },
                "children": (function () {
                    var selectedIndex = 0, containers = Object.keys(scope.prethings).map(function (key) {
                        var prethings = scope.prethings[key], children = Object.keys(prethings).map(function (title) {
                            var prething = prethings[title], thing = scope.GameStarter.ObjectMaker.make(title, argumentGetter(prething)), container = scope.GameStarter.createElement("div", {
                                "className": "EditorListOption",
                                "options": scope.prethings[key][title].options,
                                "children": [thing.canvas],
                                "onclick": clicker.bind(scope, title)
                            }), sizeMax = 70, widthThing = thing.width * scope.GameStarter.unitsize, heightThing = thing.height * scope.GameStarter.unitsize, widthDiff = (sizeMax - widthThing) / 2, heightDiff = (sizeMax - heightThing) / 2;
                            container.setAttribute("name", title);
                            thing.canvas.style.top = heightDiff + "px";
                            thing.canvas.style.right = widthDiff + "px";
                            thing.canvas.style.bottom = heightDiff + "px";
                            thing.canvas.style.left = widthDiff + "px";
                            scope.GameStarter.PixelDrawer.setThingSprite(thing);
                            return container;
                        });
                        return scope.GameStarter.createElement("div", {
                            "className": "EditorOptionContainer",
                            "style": {
                                "display": "none"
                            },
                            "children": children
                        });
                    }), switcher = scope.createSelect(Object.keys(scope.prethings), {
                        "className": "EditorOptionContainerSwitchers",
                        "onchange": function () {
                            containers[selectedIndex + 1].style.display = "none";
                            containers[switcher.selectedIndex + 1].style.display = "block";
                            selectedIndex = switcher.selectedIndex;
                        }
                    });
                    containers[0].style.display = "block";
                    containers.unshift(switcher);
                    return containers;
                })()
            });
            this.display.sections.ClickToPlace.container.appendChild(this.display.sections.ClickToPlace.Things);
        };
        LevelEditr.prototype.resetDisplayOptionsListSubOptionsMacros = function () {
            var scope = this;
            if (this.display.sections.ClickToPlace.Macros) {
                this.display.sections.ClickToPlace.container.removeChild(this.display.sections.ClickToPlace.Macros);
            }
            scope.display.sections.ClickToPlace.Macros = scope.GameStarter.createElement("div", {
                "className": "EditorSectionSecondary EditorOptions EditorOptions-Macros",
                "style": {
                    "display": "none"
                },
                "children": Object.keys(scope.macros).map(function (key) {
                    var macro = scope.macros[key];
                    return scope.GameStarter.createElement("div", {
                        "className": "EditorOptionContainer",
                        "children": [
                            scope.GameStarter.createElement("div", {
                                "className": "EditorOptionTitle EditorMenuOption",
                                "textContent": key,
                                "onclick": scope.onMacroIconClick.bind(scope, key, macro.description, macro.options)
                            })
                        ]
                    });
                })
            });
            this.display.sections.ClickToPlace.container.appendChild(this.display.sections.ClickToPlace.Macros);
        };
        LevelEditr.prototype.setSectionClickToPlace = function () {
            this.display.sections.ClickToPlace.VisualOptions.style.display = "block";
            this.display.sections.ClickToPlace.container.style.display = "block";
            this.display.sections.MapSettings.container.style.display = "none";
            this.display.sections.JSON.style.display = "none";
            this.display.sections.buttons.ClickToPlace.container.style.backgroundColor = "white";
            this.display.sections.buttons.MapSettings.style.background = "gray";
            this.display.sections.buttons.JSON.style.background = "gray";
            if (this.currentClickMode !== "Thing" && this.currentClickMode !== "Macro") {
                this.display.sections.buttons.ClickToPlace.Things.click();
            }
        };
        LevelEditr.prototype.setSectionMapSettings = function (event) {
            this.setCurrentClickMode("Map", event);
            this.display.sections.ClickToPlace.VisualOptions.style.display = "none";
            this.display.sections.ClickToPlace.container.style.display = "none";
            this.display.sections.MapSettings.container.style.display = "block";
            this.display.sections.JSON.style.display = "none";
            this.display.sections.buttons.ClickToPlace.container.style.background = "gray";
            this.display.sections.buttons.MapSettings.style.background = "white";
            this.display.sections.buttons.JSON.style.background = "gray";
        };
        LevelEditr.prototype.setSectionJSON = function (event) {
            this.setCurrentClickMode("JSON", event);
            this.display.sections.ClickToPlace.VisualOptions.style.display = "none";
            this.display.sections.ClickToPlace.container.style.display = "none";
            this.display.sections.MapSettings.container.style.display = "none";
            this.display.sections.JSON.style.display = "block";
            this.display.sections.buttons.ClickToPlace.container.style.background = "gray";
            this.display.sections.buttons.MapSettings.style.background = "gray";
            this.display.sections.buttons.JSON.style.background = "white";
        };
        LevelEditr.prototype.setSectionClickToPlaceThings = function (event) {
            this.setCurrentClickMode("Thing", event);
            this.display.container.onclick = this.onClickEditingThing.bind(this);
            this.display.scrollers.container.onclick = this.onClickEditingThing.bind(this);
            this.display.sections.ClickToPlace.VisualOptions.style.display = "block";
            this.display.sections.ClickToPlace.Things.style.display = "block";
            this.display.sections.ClickToPlace.Macros.style.display = "none";
            this.display.sections.buttons.ClickToPlace.Things.style.background = "#CCC";
            this.display.sections.buttons.ClickToPlace.Macros.style.background = "#777";
        };
        LevelEditr.prototype.setSectionClickToPlaceMacros = function (event) {
            this.setCurrentClickMode("Macro", event);
            this.display.container.onclick = this.onClickEditingMacro.bind(this);
            this.display.scrollers.container.onclick = this.onClickEditingMacro.bind(this);
            this.display.sections.ClickToPlace.VisualOptions.style.display = "block";
            this.display.sections.ClickToPlace.Things.style.display = "none";
            this.display.sections.ClickToPlace.Macros.style.display = "block";
            this.display.sections.buttons.ClickToPlace.Things.style.background = "#777";
            this.display.sections.buttons.ClickToPlace.Macros.style.background = "#CCC";
        };
        LevelEditr.prototype.setTextareaValue = function (value, doBeautify) {
            if (doBeautify === void 0) { doBeautify = false; }
            if (doBeautify) {
                this.display.stringer.textarea.value = this.beautifier(value);
            }
            else {
                this.display.stringer.textarea.value = value;
            }
        };
        LevelEditr.prototype.beautifyTextareaValue = function () {
            this.display.stringer.textarea.value = this.beautifier(this.display.stringer.textarea.value);
        };
        LevelEditr.prototype.setVisualOptions = function (name, description, options) {
            var visual = this.display.sections.ClickToPlace.VisualOptions, clicker = this.createVisualOption.bind(this), scope = this;
            visual.textContent = "";
            visual.appendChild(this.GameStarter.createElement("h3", {
                "className": "VisualOptionName",
                "textContent": name.replace(/([A-Z][a-z])/g, " $1")
            }));
            if (description) {
                visual.appendChild(this.GameStarter.createElement("div", {
                    "className": "VisualOptionDescription",
                    "textContent": description
                }));
            }
            if (options) {
                visual.appendChild(scope.GameStarter.createElement("div", {
                    "className": "VisualOptionsList",
                    "children": Object.keys(options).map(function (key) {
                        return scope.GameStarter.createElement("div", {
                            "className": "VisualOption",
                            "children": [
                                scope.GameStarter.createElement("div", {
                                    "className": "VisualOptionLabel",
                                    "textContent": key
                                }),
                                clicker(options[key])
                            ]
                        });
                    })
                }));
            }
        };
        LevelEditr.prototype.createVisualOption = function (optionRaw) {
            var option = this.createVisualOptionObject(optionRaw);
            switch (option.type) {
                case "Boolean":
                    return this.createVisualOptionBoolean();
                case "Number":
                    return this.createVisualOptionNumber(option);
                case "Select":
                    return this.createVisualOptionSelect(option);
                case "String":
                    return this.createVisualOptionString(option);
                case "Location":
                    return this.createVisualOptionLocation(option);
                case "Area":
                    return this.createVisualOptionArea(option);
                case "Everything":
                    return this.createVisualOptionEverything(option);
                default:
                    throw new Error("Unknown type requested: '" + option.type + "'.");
            }
        };
        LevelEditr.prototype.createVisualOptionObject = function (optionRaw) {
            var option;
            switch (optionRaw.constructor) {
                case Number:
                    option = {
                        "type": "Number",
                        "mod": optionRaw
                    };
                    break;
                case String:
                    option = {
                        "type": optionRaw
                    };
                    break;
                case Array:
                    option = {
                        "type": "Select",
                        "options": optionRaw
                    };
                    break;
                default:
                    option = optionRaw;
            }
            return option;
        };
        LevelEditr.prototype.createVisualOptionBoolean = function () {
            var select = this.createSelect([
                "false", "true"
            ], {
                "className": "VisualOptionValue",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data:type", "Boolean");
            return select;
        };
        LevelEditr.prototype.createVisualOptionNumber = function (option) {
            var scope = this;
            return this.GameStarter.createElement("div", {
                "className": "VisualOptionHolder",
                "children": (function () {
                    var modReal = option.mod || 1, input = scope.GameStarter.createElement("input", {
                        "type": "Number",
                        "data:type": "Number",
                        "value": (option.value === undefined) ? 1 : option.value,
                        "className": "VisualOptionValue modReal" + modReal,
                        "onkeyup": scope.setCurrentArgs.bind(scope),
                        "onchange": scope.setCurrentArgs.bind(scope)
                    }), recommendation = modReal > 1
                        && scope.GameStarter.createElement("div", {
                            "className": "VisualOptionRecommendation",
                            "textContent": "x" + option.mod
                        }), children = [input];
                    input.setAttribute("data:mod", modReal.toString());
                    input.setAttribute("data:type", "Number");
                    input.setAttribute("typeReal", "Number");
                    if (option.Infinite) {
                        var valueOld = undefined, infinite = scope.createSelect([
                            "Number", "Infinite"
                        ], {
                            "className": "VisualOptionInfiniter",
                            "onchange": function (event) {
                                if (infinite.value === "Number") {
                                    input.type = "Number";
                                    input.disabled = false;
                                    input.style.display = "";
                                    if (recommendation) {
                                        recommendation.style.display = "";
                                    }
                                    input.value = valueOld;
                                    input.onchange(event);
                                }
                                else {
                                    input.type = "Text";
                                    input.disabled = true;
                                    input.style.display = "none";
                                    if (recommendation) {
                                        recommendation.style.display = "none";
                                    }
                                    valueOld = input.value;
                                    input.value = "Infinity";
                                    input.onchange(event);
                                }
                            }
                        });
                        if (option.value === Infinity) {
                            infinite.value = "Infinite";
                            infinite.onchange(undefined);
                        }
                        children.push(infinite);
                    }
                    if (recommendation) {
                        children.push(recommendation);
                    }
                    return children;
                })()
            });
        };
        LevelEditr.prototype.createVisualOptionSelect = function (option) {
            var select = this.createSelect(option.options, {
                "className": "VisualOptionValue",
                "data:type": "Select",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data:type", "Select");
            return select;
        };
        LevelEditr.prototype.createVisualOptionString = function (option) {
            var select = this.createSelect(option.options, {
                "className": "VisualOptionValue",
                "data:type": "String",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data:type", "String");
            return select;
        };
        LevelEditr.prototype.createVisualOptionLocation = function (option) {
            var map = this.getMapObject(), locations, select;
            if (!map) {
                return this.GameStarter.createElement("div", {
                    "className": "VisualOptionValue VisualOptionLocation EditorComplaint",
                    "text": "Fix map compilation to get locations!"
                });
            }
            locations = Object.keys(map.locations);
            locations.unshift(this.keyUndefined);
            select = this.createSelect(locations, {
                "className": "VisualOptionValue VisualOptionLocation",
                "data-type": "String",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data-type", "String");
            return select;
        };
        LevelEditr.prototype.createVisualOptionArea = function (option) {
            var map = this.getMapObject(), areas, select;
            if (!map) {
                return this.GameStarter.createElement("div", {
                    "className": "VisualOptionValue VisualOptionArea EditorComplaint",
                    "text": "Fix map compilation to get areas!"
                });
            }
            areas = Object.keys(map.areas);
            areas.unshift(this.keyUndefined);
            select = this.createSelect(areas, {
                "className": "VisualOptionValue VisualOptionArea",
                "data-type": "String",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data-type", "String");
            return select;
        };
        LevelEditr.prototype.createVisualOptionEverything = function (option) {
            var select = this.createSelect(Object.keys(this.things), {
                "className": "VisualOptionValue VisualOptionEverything",
                "data-type": "String",
                "onkeyup": this.setCurrentArgs.bind(this),
                "onchange": this.setCurrentArgs.bind(this)
            });
            select.setAttribute("data-type", "String");
            return select;
        };
        LevelEditr.prototype.resetDisplayMap = function () {
            this.setTextareaValue(this.stringifySmart(this.mapDefault), true);
            this.setDisplayMap(true);
        };
        LevelEditr.prototype.setDisplayMap = function (doDisableThings) {
            var value = this.display.stringer.textarea.value, mapName = this.getMapName(), testObject, map;
            try {
                testObject = this.parseSmart(value);
                this.setTextareaValue(this.display.stringer.textarea.value);
            }
            catch (error) {
                this.setSectionJSON();
                this.display.stringer.messenger.textContent = error.message;
                return;
            }
            try {
                this.GameStarter.MapsCreator.storeMap(mapName, testObject);
                map = this.GameStarter.MapsCreator.getMap(mapName);
            }
            catch (error) {
                this.setSectionJSON();
                this.display.stringer.messenger.textContent = error.message;
                return;
            }
            this.display.stringer.messenger.textContent = "";
            this.setTextareaValue(this.display.stringer.textarea.value);
            this.GameStarter.setMap(mapName, this.getCurrentLocation());
            this.resetDisplayOptionsListSubOptionsThings();
            if (doDisableThings) {
                this.disableAllThings();
            }
        };
        LevelEditr.prototype.getMapName = function () {
            return this.display.namer.value || this.mapNameDefault;
        };
        LevelEditr.prototype.roundTo = function (num, rounding) {
            return Math.round(num / rounding) * rounding;
        };
        LevelEditr.prototype.stringifySmart = function (object) {
            if (object === void 0) { object = {}; }
            return JSON.stringify(object, this.jsonReplacerSmart);
        };
        LevelEditr.prototype.parseSmart = function (text) {
            var map = JSON.parse(text, this.jsonReplacerSmart), areas = map.areas, i;
            for (i in areas) {
                if (areas.hasOwnProperty(i)) {
                    areas[i].editor = true;
                }
            }
            return map;
        };
        LevelEditr.prototype.jsonReplacerSmart = function (key, value) {
            if (value !== value) {
                return "NaN";
            }
            else if (value === Infinity) {
                return "Infinity";
            }
            else if (value === -Infinity) {
                return "-Infinity";
            }
            else {
                return value;
            }
        };
        LevelEditr.prototype.disableThing = function (thing, opacity) {
            if (opacity === void 0) { opacity = 1; }
            thing.movement = undefined;
            thing.nofall = true;
            thing.nocollide = true;
            thing.outerok = 2;
            thing.xvel = 0;
            thing.yvel = 0;
            thing.opacity = opacity;
        };
        LevelEditr.prototype.disableAllThings = function () {
            var scope = this, groups = this.GameStarter.GroupHolder.getGroups(), i;
            for (i in groups) {
                if (groups.hasOwnProperty(i)) {
                    groups[i].forEach(function (thing) {
                        scope.disableThing(thing);
                    });
                }
            }
            this.GameStarter.TimeHandler.cancelAllEvents();
        };
        LevelEditr.prototype.addThingAndDisableEvents = function (thing, x, y) {
            var left = this.roundTo(x, this.GameStarter.scale), top = this.roundTo(y, this.GameStarter.scale);
            this.GameStarter.addThing(thing, left, top);
            this.disableThing(thing);
            this.GameStarter.TimeHandler.cancelAllEvents();
            if ((thing.hasOwnProperty("hidden") && thing.hidden) || thing.opacity === 0) {
                thing.hidden = false;
                thing.opacity = .35;
            }
        };
        LevelEditr.prototype.clearAllThings = function () {
            var scope = this, groups = this.GameStarter.GroupHolder.getGroups(), i;
            for (i in groups) {
                if (groups.hasOwnProperty(i)) {
                    groups[i].forEach(function (thing) {
                        scope.GameStarter.killNormal(thing);
                    });
                }
            }
        };
        LevelEditr.prototype.getNormalizedX = function (raw) {
            return raw / this.GameStarter.unitsize;
        };
        LevelEditr.prototype.getNormalizedY = function (raw) {
            return this.GameStarter.MapScreener.floor
                - (raw / this.GameStarter.unitsize)
                + this.GameStarter.unitsize * 3;
        };
        LevelEditr.prototype.getNormalizedThingArguments = function (args) {
            var argsNormal = this.GameStarter.proliferate({}, args);
            if (argsNormal.height === Infinity) {
                argsNormal.height = this.GameStarter.MapScreener.height;
            }
            if (argsNormal.width === Infinity) {
                argsNormal.width = this.GameStarter.MapScreener.width;
            }
            return argsNormal;
        };
        LevelEditr.prototype.getNormalizedMouseEventCoordinates = function (event, referenceThing) {
            var x = this.roundTo(event.x || event.clientX || 0, this.blocksize), y = this.roundTo(event.y || event.clientY || 0, this.blocksize), prething;
            if (referenceThing) {
                prething = this.things[this.currentTitle];
                if (prething.offsetLeft) {
                    x += prething.offsetLeft * this.GameStarter.unitsize;
                }
                if (prething.offsetTop) {
                    y += prething.offsetTop * this.GameStarter.unitsize;
                }
            }
            return [x, y];
        };
        LevelEditr.prototype.getPrethingSizeArguments = function (descriptor) {
            var output = {}, width = this.getPrethingSizeArgument(descriptor.width), height = this.getPrethingSizeArgument(descriptor.height);
            if (width) {
                output.width = width;
            }
            if (height) {
                output.height = height;
            }
            return output;
        };
        LevelEditr.prototype.getPrethingSizeArgument = function (descriptor) {
            if (!descriptor) {
                return undefined;
            }
            if (descriptor.real) {
                return descriptor.real;
            }
            var value = descriptor.value || 1, mod = descriptor.mod || 1;
            if (!isFinite(value)) {
                return mod || 8;
            }
            return value * mod;
        };
        LevelEditr.prototype.createSelect = function (options, attributes) {
            var select = this.GameStarter.createElement("select", attributes), i;
            for (i = 0; i < options.length; i += 1) {
                select.appendChild(this.GameStarter.createElement("option", {
                    "value": options[i],
                    "textContent": options[i]
                }));
            }
            if (typeof attributes.value !== "undefined") {
                select.value = attributes.value;
            }
            this.applyElementAttributes(select, attributes);
            return select;
        };
        LevelEditr.prototype.applyElementAttributes = function (element, attributes) {
            var i;
            for (i in attributes) {
                if (attributes.hasOwnProperty(i) && i.indexOf("data:") === 0) {
                    element.setAttribute(i, attributes[i]);
                }
            }
        };
        LevelEditr.prototype.downloadFile = function (name, content) {
            var link = this.GameStarter.createElement("a", {
                "download": name,
                "href": "data:text/json;charset=utf-8," + encodeURIComponent(content)
            });
            this.display.container.appendChild(link);
            link.click();
            this.display.container.removeChild(link);
            return link;
        };
        LevelEditr.prototype.killCurrentPreThings = function () {
            for (var i = 0; i < this.currentPreThings.length - 1; i += 1) {
                this.GameStarter.killNormal(this.currentPreThings[i].thing);
            }
        };
        LevelEditr.prototype.handleUploadStart = function (event) {
            var file, reader;
            this.cancelEvent(event);
            if (event && event.dataTransfer) {
                file = event.dataTransfer.files[0];
            }
            else {
                file = this.display.inputDummy.files[0];
                reader = new FileReader();
            }
            if (!file) {
                return;
            }
            reader = new FileReader();
            reader.onloadend = this.handleUploadCompletion.bind(this);
            reader.readAsText(file);
        };
        LevelEditr.prototype.handleDragEnter = function (event) {
            this.setSectionJSON();
        };
        LevelEditr.prototype.handleDragOver = function (event) {
            this.cancelEvent(event);
        };
        LevelEditr.prototype.handleDragDrop = function (event) {
            this.handleUploadStart(event);
        };
        LevelEditr.prototype.cancelEvent = function (event) {
            if (!event) {
                return;
            }
            if (typeof event.preventDefault === "function") {
                event.preventDefault();
            }
            if (typeof event.stopPropagation === "function") {
                event.stopPropagation();
            }
            event.cancelBubble = true;
        };
        LevelEditr.prototype.createPageStyles = function () {
            return {
                ".LevelEditor": {
                    "position": "absolute",
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "left": "0"
                },
                ".LevelEditor h4": {
                    "margin": "14px 0 7px 0"
                },
                ".LevelEditor select, .LevelEditor input": {
                    "margin": "7px",
                    "padding": "3px 7px",
                    "font-size": "1.17em"
                },
                ".LevelEditor .EditorGui": {
                    "position": "absolute",
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "width": "50%",
                    "background": "rgba(0, 7, 14, .84)",
                    "overflow": "hidden",
                    "user-select": "none",
                    "box-sizing": "border-box",
                    "z-index": "70",
                    "transition": "117ms all"
                },
                ".LevelEditor .EditorMenuContainer": {
                    "position": "absolute",
                    "top": "0",
                    "right": "0",
                    "bottom": "0",
                    "width": "50%",
                    "background": "rgba(0, 7, 14, .84)",
                    "overflow": "hidden",
                    "user-select": "none",
                    "box-sizing": "border-box",
                    "z-index": "70",
                    "transition": "117ms all"
                },
                ".LevelEditor .EditorScrollers": {
                    "position": "absolute",
                    "top": "0",
                    "right": "50%",
                    "bottom": "0",
                    "left": "0",
                    "transition": "117ms all"
                },
                ".EditorScroller": {
                    "position": "absolute",
                    "top": "50%",
                    "margin-top": "-35px",
                    "width": "70px",
                    "cursor": "pointer",
                    "box-sizing": "border-box",
                    "font-size": "70px",
                    "text-align": "center",
                    "transition": "280ms all"
                },
                ".EditorScrollerRight": {
                    "right": "0",
                    "padding-left": ".084em"
                },
                ".EditorScrollerLeft": {
                    "left": "0"
                },
                ".LevelEditor.minimized .EditorGui": {
                    "width": "117px"
                },
                ".LevelEditor.minimized .EditorMenuContainer": {
                    "width": "117px"
                },
                ".LevelEditor.minimized .EditorScrollers": {
                    "right": "117px",
                    "padding-right": "117px"
                },
                ".LevelEditor .EditorHead": {
                    "position": "relative",
                    "height": "35px"
                },
                ".LevelEditor .EditorHead .EditorNameContainer": {
                    "position": "absolute",
                    "top": "1px",
                    "right": "73px",
                    "left": "2px",
                    "height": "35px"
                },
                ".LevelEditor .EditorHead .EditorNameInput": {
                    "display": "block",
                    "margin": "0",
                    "padding": "3px 7px",
                    "width": "100%",
                    "background": "white",
                    "border": "1px solid black",
                    "font-size": "1.4em",
                    "box-sizing": "border-box"
                },
                ".LevelEditor .EditorHead .EditorHeadButton": {
                    "position": "absolute",
                    "top": "2px",
                    "width": "32px",
                    "height": "32px",
                    "background": "rgb(35,35,35)",
                    "border": "1px solid silver",
                    "box-sizing": "border-box",
                    "text-align": "center",
                    "padding-top": "7px",
                    "cursor": "pointer"
                },
                ".LevelEditor .EditorHead .EditorMinimizer": {
                    "right": "38px"
                },
                ".LevelEditor .EditorHead .EditorCloser": {
                    "right": "3px"
                },
                ".LevelEditor .EditorSectionChooser": {
                    "width": "50%",
                    "box-sizing": "border-box",
                    "height": "35px",
                    "background": "white",
                    "border": "3px solid black",
                    "color": "black",
                    "cursor": "pointer"
                },
                ".LevelEditor .EditorSectionChooser.Inactive": {
                    "background": "gray"
                },
                ".LevelEditor.minimized .EditorSectionChoosers": {
                    "opacity": "0"
                },
                ".LevelEditor .EditorSectionMain": {
                    "position": "absolute",
                    "top": "70px",
                    "right": "0",
                    "bottom": "35px",
                    "left": "0",
                    "overflow-y": "auto"
                },
                ".LevelEditor.minimized .EditorSectionMain": {
                    "display": "none"
                },
                ".LevelEditor .EditorSectionSecondary": {
                    "position": "absolute",
                    "top": "35px",
                    "right": "203px",
                    "bottom": "0px",
                    "left": "0",
                    "min-width": "182px",
                    "overflow-y": "auto",
                    "overflow-x": "hidden"
                },
                ".LevelEditor .EditorJSON": {
                    "font-family": "Courier"
                },
                ".LevelEditor .EditorJSONInput": {
                    "display": "block",
                    "width": "100%",
                    "height": "84%",
                    "background": "rgba(0, 3, 7, .91)",
                    "color": "rgba(255, 245, 245, .91)",
                    "box-sizing": "border-box",
                    "overflow-y": "auto",
                    "resize": "none"
                },
                ".LevelEditor .EditorJSONInfo": {
                    "height": "1.75em",
                    "padding": "3px 7px"
                },
                ".LevelEditor.minimized .EditorJSON": {
                    "opacity": "0"
                },
                ".LevelEditor .EditorOptions, .LevelEditor .EditorOptionContainer": {
                    "padding-left": "3px",
                    "clear": "both"
                },
                ".LevelEditor.minimized .EditorOptionsList": {
                    "opacity": "0"
                },
                ".LevelEditor .EditorListOption": {
                    "position": "relative",
                    "float": "left",
                    "margin": "0 7px 7px 0",
                    "width": "70px",
                    "height": "70px",
                    "background": "rgba(77, 77, 77, .7)",
                    "border": "2px solid black",
                    "overflow": "hidden",
                    "cursor": "pointer"
                },
                ".LevelEditor .EditorListOption canvas": {
                    "position": "absolute"
                },
                ".LevelEditor .EditorVisualOptions": {
                    "position": "absolute",
                    "top": "105px",
                    "right": "0",
                    "bottom": "35px",
                    "padding": "7px 11px",
                    "width": "203px",
                    "border-left": "1px solid silver",
                    "background": "rgba(0, 7, 14, .84)",
                    "overflow-x": "visible",
                    "overflow-y": "auto",
                    "line-height": "140%",
                    "opacity": "1",
                    "box-sizing": "border-box",
                    "transition": "117ms opacity, 70ms left"
                },
                ".LevelEditor.thin .EditorVisualOptions": {
                    "left": "185px"
                },
                ".LevelEditor.thin .EditorVisualOptions:hover": {
                    "left": "70px",
                    "right": "0",
                    "width": "auto",
                    "overflow-x": "hidden"
                },
                ".LevelEditor.thick .EditorVisualOptions": {
                    "width": "350px"
                },
                ".LevelEditor.thick .EditorSectionSecondary": {
                    "right": "350px"
                },
                ".LevelEditor.minimized .EditorVisualOptions": {
                    "left": "100%"
                },
                ".LevelEditor .EditorVisualOptions .VisualOption": {
                    "padding": "14px 0"
                },
                ".LevelEditor .EditorVisualOptions .VisualOptionName": {
                    "margin": "3px 0 7px 0"
                },
                ".LevelEditor .EditorVisualOptions .VisualOptionDescription": {
                    "padding-bottom": "14px"
                },
                ".LevelEditor .EditorVisualOptions .VisualOptionValue": {
                    "max-width": "117px"
                },
                ".LevelEditor .EditorVisualOptions select.VisualOptionValue": {
                    "max-width": "156px"
                },
                ".LevelEditor .EditorVisualOptions .VisualOptionInfiniter, .LevelEditor .EditorVisualOptions .VisualOptionRecommendation": {
                    "display": "inline"
                },
                ".LevelEditor .EditorMenu": {
                    "position": "absolute",
                    "right": "0",
                    "bottom": "0",
                    "left": "0"
                },
                ".LevelEditor .EditorMenuOption": {
                    "display": "inline-block",
                    "padding": "7px 14px",
                    "background": "white",
                    "border": "3px solid black",
                    "box-sizing": "border-box",
                    "color": "black",
                    "text-align": "center",
                    "overflow": "hidden",
                    "cursor": "pointer"
                },
                ".LevelEditor.minimized .EditorMenuOption:not(:first-of-type)": {
                    "display": "none"
                },
                ".LevelEditor.minimized .EditorMenuOption:first-of-type": {
                    "width": "auto"
                },
                ".LevelEditor .EditorMenuOption:hover": {
                    "opacity": ".91"
                },
                ".LevelEditor .EditorMenuOption.EditorMenuOptionHalf": {
                    "width": "50%"
                },
                ".LevelEditor .EditorMenuOption.EditorMenuOptionThird": {
                    "width": "33%"
                },
                ".LevelEditor .EditorMenuOption.EditorMenuOptionFifth": {
                    "width": "20%"
                },
                ".LevelEditor .EditorMapSettingsGroup": {
                    "padding-left": "7px"
                },
                ".LevelEditor .EditorMapSettingsSubGroup": {
                    "padding-left": "14px"
                },
                ".LevelEditor.minimized .EditorMapSettings": {
                    "opacity": "0"
                }
            };
        };
        return LevelEditr;
    })();
    LevelEditr_1.LevelEditr = LevelEditr;
})(LevelEditr || (LevelEditr = {}));
var MathDecidr;
(function (MathDecidr_1) {
    "use strict";
    var MathDecidr = (function () {
        function MathDecidr(settings) {
            if (settings === void 0) { settings = {}; }
            var i;
            this.constants = settings.constants || {};
            this.equations = {};
            this.equationsRaw = settings.equations || {};
            if (this.equationsRaw) {
                for (i in this.equationsRaw) {
                    if (this.equationsRaw.hasOwnProperty(i)) {
                        this.addEquation(i, this.equationsRaw[i]);
                    }
                }
            }
        }
        MathDecidr.prototype.getConstants = function () {
            return this.constants;
        };
        MathDecidr.prototype.getConstant = function (name) {
            return this.constants[name];
        };
        MathDecidr.prototype.getEquations = function () {
            return this.equations;
        };
        MathDecidr.prototype.getRawEquations = function () {
            return this.equationsRaw;
        };
        MathDecidr.prototype.getEquation = function (name) {
            return this.equations[name];
        };
        MathDecidr.prototype.getRawEquation = function (name) {
            return this.equationsRaw[name];
        };
        MathDecidr.prototype.addConstant = function (name, value) {
            this.constants[name] = value;
        };
        MathDecidr.prototype.addEquation = function (name, value) {
            this.equationsRaw[name] = value;
            this.equations[name] = value.bind(this, this.constants, this.equations);
        };
        MathDecidr.prototype.compute = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return this.equations[name].apply(this, Array.prototype.slice.call(arguments, 1));
        };
        return MathDecidr;
    })();
    MathDecidr_1.MathDecidr = MathDecidr;
})(MathDecidr || (MathDecidr = {}));
var ModAttachr;
(function (ModAttachr_1) {
    "use strict";
    var ModAttachr = (function () {
        function ModAttachr(settings) {
            this.mods = {};
            this.events = {};
            if (!settings) {
                return;
            }
            this.scopeDefault = settings.scopeDefault;
            if (settings.ItemsHoldr) {
                this.ItemsHolder = settings.ItemsHoldr;
            }
            else if (settings.storeLocally) {
                this.ItemsHolder = new ItemsHoldr.ItemsHoldr();
            }
            if (settings.mods) {
                this.addMods.apply(this, settings.mods);
            }
        }
        ModAttachr.prototype.getMods = function () {
            return this.mods;
        };
        ModAttachr.prototype.getMod = function (name) {
            return this.mods[name];
        };
        ModAttachr.prototype.getEvents = function () {
            return this.events;
        };
        ModAttachr.prototype.getEvent = function (name) {
            return this.events[name];
        };
        ModAttachr.prototype.getItemsHolder = function () {
            return this.ItemsHolder;
        };
        ModAttachr.prototype.getScopeDefault = function () {
            return this.scopeDefault;
        };
        ModAttachr.prototype.addMod = function (mod) {
            var modEvents = mod.events, name;
            for (name in modEvents) {
                if (!modEvents.hasOwnProperty(name)) {
                    continue;
                }
                if (!this.events.hasOwnProperty(name)) {
                    this.events[name] = [mod];
                }
                else {
                    this.events[name].push(mod);
                }
            }
            mod.scope = mod.scope || this.scopeDefault;
            this.mods[mod.name] = mod;
            if (mod.enabled && mod.events.hasOwnProperty("onModEnable")) {
                this.fireModEvent("onModEnable", mod.name, arguments);
            }
            if (this.ItemsHolder) {
                this.ItemsHolder.addItem(mod.name, {
                    "valueDefault": 0,
                    "storeLocally": true
                });
                if (this.ItemsHolder.getItem(mod.name)) {
                    return this.enableMod(mod.name);
                }
            }
        };
        ModAttachr.prototype.addMods = function () {
            var mods = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                mods[_i - 0] = arguments[_i];
            }
            var results = [], i;
            for (i = 0; i < mods.length; i += 1) {
                results.push(this.addMod(mods[i]));
            }
            return results;
        };
        ModAttachr.prototype.enableMod = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var mod = this.mods[name];
            if (!mod) {
                throw new Error("No mod of name: '" + name + "'");
            }
            args = [].slice.call(args);
            args.unshift(mod, name);
            mod.enabled = true;
            if (this.ItemsHolder) {
                this.ItemsHolder.setItem(name, true);
            }
            if (mod.events.hasOwnProperty("onModEnable")) {
                return this.fireModEvent("onModEnable", mod.name, arguments);
            }
        };
        ModAttachr.prototype.enableMods = function () {
            var names = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                names[_i - 0] = arguments[_i];
            }
            var results = [], i;
            for (i = 0; i < names.length; i += 1) {
                results.push(this.enableMod(names[i]));
            }
            return results;
        };
        ModAttachr.prototype.disableMod = function (name) {
            var mod = this.mods[name], args;
            if (!this.mods[name]) {
                throw new Error("No mod of name: '" + name + "'");
            }
            this.mods[name].enabled = false;
            args = Array.prototype.slice.call(arguments);
            args[0] = mod;
            if (this.ItemsHolder) {
                this.ItemsHolder.setItem(name, false);
            }
            if (mod.events.hasOwnProperty("onModDisable")) {
                return this.fireModEvent("onModDisable", mod.name, args);
            }
        };
        ModAttachr.prototype.disableMods = function () {
            var names = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                names[_i - 0] = arguments[_i];
            }
            var results = [], i;
            for (i = 0; i < names.length; i += 1) {
                results.push(this.disableMod(names[i]));
            }
            return results;
        };
        ModAttachr.prototype.toggleMod = function (name) {
            var mod = this.mods[name];
            if (!mod) {
                throw new Error("No mod found under " + name);
            }
            if (mod.enabled) {
                return this.disableMod(name);
            }
            else {
                return this.enableMod(name);
            }
        };
        ModAttachr.prototype.toggleMods = function () {
            var names = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                names[_i - 0] = arguments[_i];
            }
            var result = [], i;
            for (var i = 0; i < names.length; i += 1) {
                result.push(this.toggleMod(names[i]));
            }
            return result;
        };
        ModAttachr.prototype.fireEvent = function (event) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var mods = this.events[event], mod, i;
            if (!mods) {
                return;
            }
            args = [].slice.call(args);
            args.unshift(undefined, event);
            for (i = 0; i < mods.length; i += 1) {
                mod = mods[i];
                if (mod.enabled) {
                    args[0] = mod;
                    mod.events[event].apply(mod.scope, args);
                }
            }
        };
        ModAttachr.prototype.fireModEvent = function (event, modName) {
            var args = [];
            for (var _i = 2; _i < arguments.length; _i++) {
                args[_i - 2] = arguments[_i];
            }
            var mod = this.mods[modName], fires;
            if (!mod) {
                throw new Error("Unknown mod requested: '" + modName + "'");
            }
            args = [].slice.call(args);
            args.unshift(mod, event);
            fires = mod.events[event];
            if (!fires) {
                throw new Error("Mod does not contain event: '" + event + "'");
            }
            return fires.apply(mod.scope, args);
        };
        return ModAttachr;
    })();
    ModAttachr_1.ModAttachr = ModAttachr;
})(ModAttachr || (ModAttachr = {}));
var NumberMakr;
(function (NumberMakr_1) {
    "use strict";
    var NumberMakr = (function () {
        function NumberMakr(settings) {
            if (settings === void 0) { settings = {}; }
            this.stateLength = settings.stateLength || 624;
            this.statePeriod = settings.statePeriod || 397;
            this.matrixA = settings.matrixA || 0x9908b0df;
            this.maskUpper = settings.maskUpper || 0x80000000;
            this.maskLower = settings.maskLower || 0x7fffffff;
            this.stateVector = new Array(this.stateLength);
            this.stateIndex = this.stateLength + 1;
            this.matrixAMagic = new Array(0x0, this.matrixA);
            this.resetFromSeed(settings.seed || new Date().getTime());
        }
        NumberMakr.prototype.getSeed = function () {
            return this.seed;
        };
        NumberMakr.prototype.getStateLength = function () {
            return this.stateLength;
        };
        NumberMakr.prototype.getStatePeriod = function () {
            return this.statePeriod;
        };
        NumberMakr.prototype.getMatrixA = function () {
            return this.matrixA;
        };
        NumberMakr.prototype.getMaskUpper = function () {
            return this.maskUpper;
        };
        NumberMakr.prototype.getMaskLower = function () {
            return this.maskLower;
        };
        NumberMakr.prototype.resetFromSeed = function (seedNew) {
            var s;
            this.stateVector[0] = seedNew >>> 0;
            for (this.stateIndex = 1; this.stateIndex < this.stateLength; this.stateIndex += 1) {
                s = this.stateVector[this.stateIndex - 1] ^ (this.stateVector[this.stateIndex - 1] >>> 30);
                this.stateVector[this.stateIndex] = ((((((s & 0xffff0000) >>> 16) * 1812433253) << 16)
                    + (s & 0x0000ffff) * 1812433253) + this.stateIndex) >>> 0;
            }
            this.seed = seedNew;
        };
        NumberMakr.prototype.resetFromArray = function (keyInitial, keyLength) {
            if (keyLength === void 0) { keyLength = keyInitial.length; }
            var i = 1, j = 0, k, s;
            this.resetFromSeed(19650218);
            if (typeof (keyLength) === "undefined") {
                keyLength = keyInitial.length;
            }
            k = this.stateLength > keyLength ? this.stateLength : keyLength;
            while (k > 0) {
                s = this.stateVector[i - 1] ^ (this.stateVector[i - 1] >>> 30);
                this.stateVector[i] = (this.stateVector[i] ^ (((((s & 0xffff0000) >>> 16) * 1664525) << 16)
                    + ((s & 0x0000ffff) * 1664525)) + keyInitial[j] + j) >>> 0;
                i += 1;
                j += 1;
                if (i >= this.stateLength) {
                    this.stateVector[0] = this.stateVector[this.stateLength - 1];
                    i = 1;
                }
                if (j >= keyLength) {
                    j = 0;
                }
            }
            for (k = this.stateLength - 1; k; k -= 1) {
                s = this.stateVector[i - 1] ^ (this.stateVector[i - 1] >>> 30);
                this.stateVector[i] = ((this.stateVector[i] ^ (((((s & 0xffff0000) >>> 16) * 1566083941) << 16)
                    + (s & 0x0000ffff) * 1566083941)) - i) >>> 0;
                i += 1;
                if (i >= this.stateLength) {
                    this.stateVector[0] = this.stateVector[this.stateLength - 1];
                    i = 1;
                }
            }
            this.stateVector[0] = 0x80000000;
            this.seed = keyInitial;
        };
        NumberMakr.prototype.randomInt32 = function () {
            var y, kk;
            if (this.stateIndex >= this.stateLength) {
                if (this.stateIndex === this.stateLength + 1) {
                    this.resetFromSeed(5489);
                }
                for (kk = 0; kk < this.stateLength - this.statePeriod; kk += 1) {
                    y = (this.stateVector[kk] & this.maskUpper)
                        | (this.stateVector[kk + 1] & this.maskLower);
                    this.stateVector[kk] = this.stateVector[kk + this.statePeriod]
                        ^ (y >>> 1)
                        ^ this.matrixAMagic[y & 0x1];
                }
                for (; kk < this.stateLength - 1; kk += 1) {
                    y = (this.stateVector[kk] & this.maskUpper)
                        | (this.stateVector[kk + 1] & this.maskLower);
                    this.stateVector[kk] = this.stateVector[kk + (this.statePeriod - this.stateLength)]
                        ^ (y >>> 1)
                        ^ this.matrixAMagic[y & 0x1];
                }
                y = (this.stateVector[this.stateLength - 1] & this.maskUpper)
                    | (this.stateVector[0] & this.maskLower);
                this.stateVector[this.stateLength - 1] = this.stateVector[this.statePeriod - 1]
                    ^ (y >>> 1) ^ this.matrixAMagic[y & 0x1];
                this.stateIndex = 0;
            }
            y = this.stateVector[this.stateIndex];
            this.stateIndex += 1;
            y ^= (y >>> 11);
            y ^= (y << 7) & 0x9d2c5680;
            y ^= (y << 15) & 0xefc60000;
            y ^= (y >>> 18);
            return y >>> 0;
        };
        NumberMakr.prototype.random = function () {
            return this.randomInt32() * (1.0 / 4294967296.0);
        };
        NumberMakr.prototype.randomInt31 = function () {
            return this.randomInt32() >>> 1;
        };
        NumberMakr.prototype.randomReal1 = function () {
            return this.randomInt32() * (1.0 / 4294967295.0);
        };
        NumberMakr.prototype.randomReal3 = function () {
            return (this.randomInt32() + 0.5) * (1.0 / 4294967296.0);
        };
        NumberMakr.prototype.randomReal53Bit = function () {
            var a = this.randomInt32() >>> 5, b = this.randomInt32() >>> 6;
            return (a * 67108864.0 + b) * (1.0 / 9007199254740992.0);
        };
        NumberMakr.prototype.randomUnder = function (max) {
            return this.random() * max;
        };
        NumberMakr.prototype.randomWithin = function (min, max) {
            return this.randomUnder(max - min) + min;
        };
        NumberMakr.prototype.randomInt = function (max) {
            return this.randomUnder(max) | 0;
        };
        NumberMakr.prototype.randomIntWithin = function (min, max) {
            return (this.randomUnder(max - min) + min) | 0;
        };
        NumberMakr.prototype.randomBoolean = function () {
            return this.randomInt(2) === 1;
        };
        NumberMakr.prototype.randomBooleanProbability = function (probability) {
            return this.random() < probability;
        };
        NumberMakr.prototype.randomBooleanFraction = function (numerator, denominator) {
            return this.random() <= (numerator / denominator);
        };
        NumberMakr.prototype.randomArrayIndex = function (array) {
            return this.randomIntWithin(0, array.length);
        };
        NumberMakr.prototype.randomArrayMember = function (array) {
            return array[this.randomArrayIndex(array)];
        };
        return NumberMakr;
    })();
    NumberMakr_1.NumberMakr = NumberMakr;
})(NumberMakr || (NumberMakr = {}));
var ScenePlayr;
(function (ScenePlayr_1) {
    "use strict";
    var ScenePlayr = (function () {
        function ScenePlayr(settings) {
            if (settings === void 0) { settings = {}; }
            this.cutscenes = settings.cutscenes || {};
            this.cutsceneArguments = settings.cutsceneArguments || [];
        }
        ScenePlayr.prototype.getCutscenes = function () {
            return this.cutscenes;
        };
        ScenePlayr.prototype.getCutscene = function () {
            return this.cutscene;
        };
        ScenePlayr.prototype.getOtherCutscene = function (name) {
            return this.cutscenes[name];
        };
        ScenePlayr.prototype.getRoutine = function () {
            return this.routine;
        };
        ScenePlayr.prototype.getOtherRoutine = function (name) {
            return this.cutscene.routines[name];
        };
        ScenePlayr.prototype.getCutsceneName = function () {
            return this.cutsceneName;
        };
        ScenePlayr.prototype.getCutsceneSettings = function () {
            return this.cutsceneSettings;
        };
        ScenePlayr.prototype.addCutsceneSetting = function (key, value) {
            this.cutsceneSettings[key] = value;
        };
        ScenePlayr.prototype.startCutscene = function (name, settings, args) {
            if (settings === void 0) { settings = {}; }
            if (!name) {
                throw new Error("No name given to ScenePlayr.playScene.");
            }
            if (this.cutsceneName) {
                this.stopCutscene();
            }
            this.cutscene = this.cutscenes[name];
            this.cutsceneName = name;
            this.cutsceneSettings = settings || {};
            this.cutsceneSettings.cutscene = this.cutscene;
            this.cutsceneSettings.cutsceneName = name;
            this.cutsceneArguments.push(this.cutsceneSettings);
            if (this.cutscene.firstRoutine) {
                this.playRoutine.apply(this, [this.cutscene.firstRoutine].concat(args));
            }
        };
        ScenePlayr.prototype.bindCutscene = function (name, settings, args) {
            if (settings === void 0) { settings = {}; }
            return this.startCutscene.bind(this, name, args);
        };
        ScenePlayr.prototype.stopCutscene = function () {
            this.routine = undefined;
            this.cutscene = undefined;
            this.cutsceneName = undefined;
            this.cutsceneSettings = undefined;
            this.cutsceneArguments.pop();
        };
        ScenePlayr.prototype.playRoutine = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            if (!this.cutscene) {
                throw new Error("No cutscene is currently playing.");
            }
            if (!this.cutscene.routines[name]) {
                throw new Error("The " + this.cutsceneName + " cutscene does not contain a " + name + " routine.");
            }
            var routineArgs = this.cutsceneArguments.slice();
            routineArgs.push.apply(routineArgs, args);
            this.routine = this.cutscene.routines[name];
            this.cutsceneSettings.routine = this.routine;
            this.cutsceneSettings.routineName = name;
            this.cutsceneSettings.routineArguments = args;
            this.routine.apply(this, routineArgs);
        };
        ScenePlayr.prototype.bindRoutine = function (name) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            return (_a = this.playRoutine).bind.apply(_a, [this, name].concat(args));
            var _a;
        };
        return ScenePlayr;
    })();
    ScenePlayr_1.ScenePlayr = ScenePlayr;
})(ScenePlayr || (ScenePlayr = {}));
var ThingHittr;
(function (ThingHittr_1) {
    "use strict";
    var ThingHittr = (function () {
        function ThingHittr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to ThingHittr.");
            }
            if (typeof settings.globalCheckGenerators === "undefined") {
                throw new Error("No globalCheckGenerators given to ThingHittr.");
            }
            if (typeof settings.hitCheckGenerators === "undefined") {
                throw new Error("No hitCheckGenerators given to ThingHittr.");
            }
            if (typeof settings.hitCallbackGenerators === "undefined") {
                throw new Error("No hitCallbackGenerators given to ThingHittr.");
            }
            this.keyNumQuads = settings.keyNumQuads || "numquads";
            this.keyQuadrants = settings.keyQuadrants || "quadrants";
            this.keyGroupName = settings.keyGroupName || "group";
            this.keyTypeName = settings.keyTypeName || "type";
            this.globalCheckGenerators = settings.globalCheckGenerators;
            this.hitCheckGenerators = settings.hitCheckGenerators;
            this.hitCallbackGenerators = settings.hitCallbackGenerators;
            this.generatedHitChecks = {};
            this.generatedHitCallbacks = {};
            this.generatedGlobalChecks = {};
            this.generatedHitsChecks = {};
            this.groupHitLists = this.generateGroupHitLists(this.hitCheckGenerators);
        }
        ThingHittr.prototype.cacheChecksForType = function (typeName, groupName) {
            if (!this.generatedGlobalChecks.hasOwnProperty(typeName) && this.globalCheckGenerators.hasOwnProperty(groupName)) {
                this.generatedGlobalChecks[typeName] = this.globalCheckGenerators[groupName]();
                this.generatedHitsChecks[typeName] = this.generateHitsCheck(typeName);
            }
        };
        ThingHittr.prototype.checkHitsForThing = function (thing) {
            this.generatedHitsChecks[thing[this.keyTypeName]](thing);
        };
        ThingHittr.prototype.checkHitForThings = function (thing, other) {
            return this.runThingsFunctionSafely(this.generatedHitChecks, thing, other, this.hitCheckGenerators);
        };
        ThingHittr.prototype.runHitCallbackForThings = function (thing, other) {
            this.runThingsFunctionSafely(this.generatedHitCallbacks, thing, other, this.hitCallbackGenerators);
        };
        ThingHittr.prototype.generateHitsCheck = function (typeName) {
            var _this = this;
            return function (thing) {
                if (!_this.generatedGlobalChecks[typeName](thing)) {
                    return;
                }
                var groupNames = _this.groupHitLists[thing[_this.keyGroupName]], groupName, others, other, i, j, k;
                for (i = 0; i < thing[_this.keyNumQuads]; i += 1) {
                    for (j = 0; j < groupNames.length; j += 1) {
                        groupName = groupNames[j];
                        others = thing[_this.keyQuadrants][i].things[groupName];
                        for (k = 0; k < others.length; k += 1) {
                            other = others[k];
                            if (thing === other) {
                                break;
                            }
                            if (!_this.generatedGlobalChecks[other[_this.keyTypeName]](other)) {
                                continue;
                            }
                            if (_this.checkHitForThings(thing, other)) {
                                _this.runHitCallbackForThings(thing, other);
                            }
                        }
                    }
                }
            };
        };
        ThingHittr.prototype.runThingsFunctionSafely = function (group, thing, other, generators) {
            var typeThing = thing[this.keyTypeName], typeOther = other[this.keyTypeName], container = group[typeThing], check;
            if (!container) {
                container = group[typeThing] = {};
            }
            check = container[typeOther];
            if (!check) {
                check = container[typeOther] = generators[thing[this.keyGroupName]][other[this.keyGroupName]]();
            }
            return check(thing, other);
        };
        ThingHittr.prototype.generateGroupHitLists = function (group) {
            var output = {}, i;
            for (i in group) {
                if (group.hasOwnProperty(i)) {
                    output[i] = Object.keys(group[i]);
                }
            }
            return output;
        };
        return ThingHittr;
    })();
    ThingHittr_1.ThingHittr = ThingHittr;
})(ThingHittr || (ThingHittr = {}));
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var TouchPassr;
(function (TouchPassr) {
    var Control = (function () {
        function Control(InputWriter, schema, styles) {
            this.InputWriter = InputWriter;
            this.schema = schema;
            this.resetElement(styles);
        }
        Control.prototype.getElement = function () {
            return this.element;
        };
        Control.prototype.getElementInner = function () {
            return this.elementInner;
        };
        Control.prototype.createElement = function (tag) {
            var args = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                args[_i - 1] = arguments[_i];
            }
            var element = document.createElement(tag || "div"), i;
            for (i = 0; i < args.length; i += 1) {
                this.proliferateElement(element, args[i]);
            }
            return element;
        };
        Control.prototype.proliferateElement = function (recipient, donor, noOverride) {
            if (noOverride === void 0) { noOverride = false; }
            var setting, i, j;
            for (i in donor) {
                if (donor.hasOwnProperty(i)) {
                    if (noOverride && recipient.hasOwnProperty(i)) {
                        continue;
                    }
                    setting = donor[i];
                    switch (i) {
                        case "children":
                        case "children":
                            if (typeof (setting) !== "undefined") {
                                for (j = 0; j < setting.length; j += 1) {
                                    recipient.appendChild(setting[j]);
                                }
                            }
                            break;
                        case "style":
                            this.proliferateElement(recipient[i], setting);
                            break;
                        default:
                            if (setting === null) {
                                recipient[i] = null;
                            }
                            else if (typeof setting === "object") {
                                if (!recipient.hasOwnProperty(i)) {
                                    recipient[i] = new setting.constructor();
                                }
                                this.proliferateElement(recipient[i], setting, noOverride);
                            }
                            else {
                                recipient[i] = setting;
                            }
                            break;
                    }
                }
            }
            return recipient;
        };
        Control.prototype.resetElement = function (styles, customType) {
            var _this = this;
            var position = this.schema.position, offset = position.offset;
            this.element = this.createElement("div", {
                "className": "control",
                "style": {
                    "position": "absolute",
                    "width": 0,
                    "height": 0,
                    "boxSizing": "border-box",
                    "opacity": ".84"
                }
            });
            this.elementInner = this.createElement("div", {
                "className": "control-inner",
                "textContent": this.schema.label || "",
                "style": {
                    "position": "absolute",
                    "boxSizing": "border-box",
                    "textAlign": "center"
                }
            });
            this.element.appendChild(this.elementInner);
            if (position.horizontal === "left") {
                this.element.style.left = "0";
            }
            else if (position.horizontal === "right") {
                this.element.style.right = "0";
            }
            else if (position.horizontal === "center") {
                this.element.style.left = "50%";
            }
            if (position.vertical === "top") {
                this.element.style.top = "0";
            }
            else if (position.vertical === "bottom") {
                this.element.style.bottom = "0";
            }
            else if (position.vertical === "center") {
                this.element.style.top = "50%";
            }
            this.passElementStyles(styles.global);
            this.passElementStyles(styles[customType]);
            this.passElementStyles(this.schema.styles);
            if (offset.left) {
                this.elementInner.style.marginLeft = this.createPixelMeasurement(offset.left);
            }
            if (offset.top) {
                this.elementInner.style.marginTop = this.createPixelMeasurement(offset.top);
            }
            setTimeout(function () {
                if (position.horizontal === "center") {
                    _this.elementInner.style.left = _this.createHalfSizeMeasurement(_this.elementInner, "width", "offsetWidth");
                }
                if (position.vertical === "center") {
                    _this.elementInner.style.top = _this.createHalfSizeMeasurement(_this.elementInner, "height", "offsetHeight");
                }
            });
        };
        Control.prototype.createPixelMeasurement = function (raw) {
            if (!raw) {
                return "0";
            }
            if (typeof raw === "number" || raw.constructor === Number) {
                return raw + "px";
            }
            return raw;
        };
        Control.prototype.createHalfSizeMeasurement = function (element, styleTag, attributeBackup) {
            var amountRaw, amount, units;
            amountRaw = element.style[styleTag] || (attributeBackup && element[attributeBackup]);
            if (!amountRaw) {
                return "0px";
            }
            amount = Number(amountRaw.replace(/[^\d]/g, "")) || 0;
            units = amountRaw.replace(/[\d]/g, "") || "px";
            return Math.round(amount / -2) + units;
        };
        Control.prototype.passElementStyles = function (styles) {
            if (!styles) {
                return;
            }
            if (styles.element) {
                this.proliferateElement(this.element, styles.element);
            }
            if (styles.elementInner) {
                this.proliferateElement(this.elementInner, styles.elementInner);
            }
        };
        Control.prototype.setRotation = function (element, rotation) {
            element.style.transform = "rotate(" + rotation + "deg)";
        };
        Control.prototype.getOffsets = function (element) {
            var output;
            if (element.offsetParent && element !== element.offsetParent) {
                output = this.getOffsets(element.offsetParent);
                output[0] += element.offsetLeft;
                output[1] += element.offsetTop;
            }
            else {
                output = [element.offsetLeft, element.offsetTop];
            }
            return output;
        };
        return Control;
    })();
    TouchPassr.Control = Control;
})(TouchPassr || (TouchPassr = {}));
var TouchPassr;
(function (TouchPassr) {
    var ButtonControl = (function (_super) {
        __extends(ButtonControl, _super);
        function ButtonControl() {
            _super.apply(this, arguments);
        }
        ButtonControl.prototype.resetElement = function (styles) {
            var onActivated = this.onEvent.bind(this, "activated"), onDeactivated = this.onEvent.bind(this, "deactivated");
            _super.prototype.resetElement.call(this, styles, "Button");
            this.element.addEventListener("mousedown", onActivated);
            this.element.addEventListener("touchstart", onActivated);
            this.element.addEventListener("mouseup", onDeactivated);
            this.element.addEventListener("touchend", onDeactivated);
        };
        ButtonControl.prototype.onEvent = function (which, event) {
            var events = this.schema.pipes[which], i, j;
            if (!events) {
                return;
            }
            for (i in events) {
                if (!events.hasOwnProperty(i)) {
                    continue;
                }
                for (j = 0; j < events[i].length; j += 1) {
                    this.InputWriter.callEvent(i, events[i][j], event);
                }
            }
        };
        return ButtonControl;
    })(TouchPassr.Control);
    TouchPassr.ButtonControl = ButtonControl;
})(TouchPassr || (TouchPassr = {}));
var TouchPassr;
(function (TouchPassr) {
    var JoystickControl = (function (_super) {
        __extends(JoystickControl, _super);
        function JoystickControl() {
            _super.apply(this, arguments);
        }
        JoystickControl.prototype.resetElement = function (styles) {
            _super.prototype.resetElement.call(this, styles, "Joystick");
            var directions = this.schema.directions, element, degrees, sin, cos, dx, dy, i;
            this.proliferateElement(this.elementInner, {
                "style": {
                    "border-radius": "100%"
                }
            });
            this.elementCircle = this.createElement("div", {
                "className": "control-inner control-joystick-circle",
                "style": {
                    "position": "absolute",
                    "background": "red",
                    "borderRadius": "100%"
                }
            });
            this.proliferateElement(this.elementCircle, styles.Joystick.circle);
            for (i = 0; i < directions.length; i += 1) {
                degrees = directions[i].degrees;
                sin = Math.sin(degrees * Math.PI / 180);
                cos = Math.cos(degrees * Math.PI / 180);
                dx = cos * 50 + 50;
                dy = sin * 50 + 50;
                element = this.createElement("div", {
                    "className": "control-joystick-tick",
                    "style": {
                        "position": "absolute",
                        "left": dx + "%",
                        "top": dy + "%",
                        "marginLeft": (-cos * 5 - 5) + "px",
                        "marginTop": (-sin * 2 - 1) + "px"
                    }
                });
                this.proliferateElement(element, styles.Joystick.tick);
                this.setRotation(element, degrees);
                this.elementCircle.appendChild(element);
            }
            this.elementDragLine = this.createElement("div", {
                "className": "control-joystick-drag-line",
                "style": {
                    "position": "absolute",
                    "opacity": "0",
                    "top": ".77cm",
                    "left": ".77cm"
                }
            });
            this.proliferateElement(this.elementDragLine, styles.Joystick.dragLine);
            this.elementCircle.appendChild(this.elementDragLine);
            this.elementDragShadow = this.createElement("div", {
                "className": "control-joystick-drag-shadow",
                "style": {
                    "position": "absolute",
                    "opacity": "1",
                    "top": "14%",
                    "right": "14%",
                    "bottom": "14%",
                    "left": "14%",
                    "marginLeft": "0",
                    "marginTop": "0",
                    "borderRadius": "100%"
                }
            });
            this.proliferateElement(this.elementDragShadow, styles.Joystick.dragShadow);
            this.elementCircle.appendChild(this.elementDragShadow);
            this.elementInner.appendChild(this.elementCircle);
            this.elementInner.addEventListener("click", this.triggerDragger.bind(this));
            this.elementInner.addEventListener("touchmove", this.triggerDragger.bind(this));
            this.elementInner.addEventListener("mousemove", this.triggerDragger.bind(this));
            this.elementInner.addEventListener("mouseover", this.positionDraggerEnable.bind(this));
            this.elementInner.addEventListener("touchstart", this.positionDraggerEnable.bind(this));
            this.elementInner.addEventListener("mouseout", this.positionDraggerDisable.bind(this));
            this.elementInner.addEventListener("touchend", this.positionDraggerDisable.bind(this));
        };
        JoystickControl.prototype.positionDraggerEnable = function () {
            this.dragEnabled = true;
            this.elementDragLine.style.opacity = "1";
        };
        JoystickControl.prototype.positionDraggerDisable = function () {
            this.dragEnabled = false;
            this.elementDragLine.style.opacity = "0";
            this.elementDragShadow.style.top = "14%";
            this.elementDragShadow.style.right = "14%";
            this.elementDragShadow.style.bottom = "14%";
            this.elementDragShadow.style.left = "14%";
            if (this.currentDirection) {
                if (this.currentDirection.pipes && this.currentDirection.pipes.deactivated) {
                    this.onEvent(this.currentDirection.pipes.deactivated, event);
                }
                this.currentDirection = undefined;
            }
        };
        JoystickControl.prototype.triggerDragger = function (event) {
            event.preventDefault();
            if (!this.dragEnabled) {
                return;
            }
            var coordinates = this.getEventCoordinates(event), x = coordinates[0], y = coordinates[1], offsets = this.getOffsets(this.elementInner), midX = offsets[0] + this.elementInner.offsetWidth / 2, midY = offsets[1] + this.elementInner.offsetHeight / 2, dxRaw = (x - midX) | 0, dyRaw = (midY - y) | 0, thetaRaw = this.getThetaRaw(dxRaw, dyRaw), directionNumber = this.findClosestDirection(thetaRaw), direction = this.schema.directions[directionNumber], theta = direction.degrees, components = this.getThetaComponents(theta), dx = components[0], dy = -components[1];
            theta = (theta + 450) % 360;
            this.elementDragLine.style.marginLeft = ((dx * 77) | 0) + "%";
            this.elementDragLine.style.marginTop = ((dy * 77) | 0) + "%";
            this.elementDragShadow.style.top = ((14 + dy * 10) | 0) + "%";
            this.elementDragShadow.style.right = ((14 - dx * 10) | 0) + "%";
            this.elementDragShadow.style.bottom = ((14 - dy * 10) | 0) + "%";
            this.elementDragShadow.style.left = ((14 + dx * 10) | 0) + "%";
            this.setRotation(this.elementDragLine, theta);
            this.positionDraggerEnable();
            this.setCurrentDirection(direction, event);
        };
        JoystickControl.prototype.getEventCoordinates = function (event) {
            if (event.type === "touchmove") {
                var touch = event.touches[0];
                return [touch.pageX, touch.pageY];
            }
            return [event.x, event.y];
        };
        JoystickControl.prototype.getThetaRaw = function (dxRaw, dyRaw) {
            if (dxRaw > 0) {
                if (dyRaw > 0) {
                    return Math.atan(dxRaw / dyRaw) * 180 / Math.PI;
                }
                else {
                    return -Math.atan(dyRaw / dxRaw) * 180 / Math.PI + 90;
                }
            }
            else {
                if (dyRaw < 0) {
                    return Math.atan(dxRaw / dyRaw) * 180 / Math.PI + 180;
                }
                else {
                    return -Math.atan(dyRaw / dxRaw) * 180 / Math.PI + 270;
                }
            }
        };
        JoystickControl.prototype.getThetaComponents = function (thetaRaw) {
            var theta = thetaRaw * Math.PI / 180;
            return [Math.sin(theta), Math.cos(theta)];
        };
        JoystickControl.prototype.findClosestDirection = function (degrees) {
            var directions = this.schema.directions, difference = Math.abs(directions[0].degrees - degrees), smallestDegrees = directions[0].degrees, smallestDegreesRecord = 0, record = 0, differenceTest, i;
            for (i = 1; i < directions.length; i += 1) {
                differenceTest = Math.abs(directions[i].degrees - degrees);
                if (differenceTest < difference) {
                    difference = differenceTest;
                    record = i;
                }
                if (directions[i].degrees < smallestDegrees) {
                    smallestDegrees = directions[i].degrees;
                    smallestDegreesRecord = i;
                }
            }
            differenceTest = Math.abs(smallestDegrees + 360 - degrees);
            if (differenceTest < difference) {
                difference = differenceTest;
                record = smallestDegreesRecord;
            }
            return record;
        };
        JoystickControl.prototype.setCurrentDirection = function (direction, event) {
            if (this.currentDirection === direction) {
                return;
            }
            if (this.currentDirection && this.currentDirection.pipes && this.currentDirection.pipes.deactivated) {
                this.onEvent(this.currentDirection.pipes.deactivated, event);
            }
            if (direction.pipes && direction.pipes.activated) {
                this.onEvent(direction.pipes.activated, event);
            }
            this.currentDirection = direction;
        };
        JoystickControl.prototype.onEvent = function (pipes, event) {
            var i, j;
            for (i in pipes) {
                if (!pipes.hasOwnProperty(i)) {
                    continue;
                }
                for (j = 0; j < pipes[i].length; j += 1) {
                    this.InputWriter.callEvent(i, pipes[i][j], event);
                }
            }
        };
        return JoystickControl;
    })(TouchPassr.Control);
    TouchPassr.JoystickControl = JoystickControl;
})(TouchPassr || (TouchPassr = {}));
var TouchPassr;
(function (TouchPassr_1) {
    "use strict";
    var TouchPassr = (function () {
        function TouchPassr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to TouchPassr.");
            }
            if (typeof settings.InputWriter === "undefined") {
                throw new Error("No InputWriter given to TouchPassr.");
            }
            this.InputWriter = settings.InputWriter;
            this.styles = settings.styles || {};
            this.resetContainer(settings.container);
            this.controls = {};
            if (settings.controls) {
                this.addControls(settings.controls);
            }
            if (typeof settings.enabled === "undefined") {
                this.enabled = true;
            }
            else {
                this.enabled = settings.enabled;
            }
            this.enabled ? this.enable() : this.disable();
        }
        TouchPassr.prototype.getInputWriter = function () {
            return this.InputWriter;
        };
        TouchPassr.prototype.getEnabled = function () {
            return this.enabled;
        };
        TouchPassr.prototype.getStyles = function () {
            return this.styles;
        };
        TouchPassr.prototype.getControls = function () {
            return this.controls;
        };
        TouchPassr.prototype.getContainer = function () {
            return this.container;
        };
        TouchPassr.prototype.getParentContainer = function () {
            return this.parentContainer;
        };
        TouchPassr.prototype.enable = function () {
            this.enabled = true;
            this.container.style.display = "block";
        };
        TouchPassr.prototype.disable = function () {
            this.enabled = false;
            this.container.style.display = "none";
        };
        TouchPassr.prototype.setParentContainer = function (parentElement) {
            this.parentContainer = parentElement;
            this.parentContainer.appendChild(this.container);
        };
        TouchPassr.prototype.addControls = function (schemas) {
            var i;
            for (i in schemas) {
                if (schemas.hasOwnProperty(i)) {
                    this.addControl(schemas[i]);
                }
            }
        };
        TouchPassr.prototype.addControl = function (schema) {
            if (!TouchPassr.controlClasses.hasOwnProperty(schema.control)) {
                throw new Error("Unknown control schema: '" + schema.control + "'.");
            }
            var control = new TouchPassr.controlClasses[schema.control](this.InputWriter, schema, this.styles);
            this.controls[schema.name] = control;
            this.container.appendChild(control.getElement());
        };
        TouchPassr.prototype.resetContainer = function (parentContainer) {
            this.container = TouchPassr_1.Control.prototype.createElement("div", {
                "className": "touch-passer-container",
                "style": {
                    "position": "absolute",
                    "top": 0,
                    "right": 0,
                    "bottom": 0,
                    "left": 0
                }
            });
            if (parentContainer) {
                this.setParentContainer(parentContainer);
            }
        };
        TouchPassr.controlClasses = {
            "Button": TouchPassr_1.ButtonControl,
            "Joystick": TouchPassr_1.JoystickControl
        };
        return TouchPassr;
    })();
    TouchPassr_1.TouchPassr = TouchPassr;
})(TouchPassr || (TouchPassr = {}));
var UsageHelpr;
(function (UsageHelpr_1) {
    "use strict";
    var UsageHelpr = (function () {
        function UsageHelpr(settings) {
            if (settings === void 0) { settings = {}; }
            this.openings = settings.openings || [];
            this.options = settings.options || {};
            this.optionHelp = settings.optionHelp || "";
            this.aliases = settings.aliases || [];
            this.logger = settings.logger || console.log.bind(console);
        }
        UsageHelpr.prototype.displayHelpMenu = function () {
            var _this = this;
            this.openings.forEach(function (opening) { return _this.logHelpText(opening); });
        };
        UsageHelpr.prototype.displayHelpOptions = function () {
            var _this = this;
            this.logHelpText([this.optionHelp, "code"]);
            Object.keys(this.options).forEach(function (key) { return _this.displayHelpGroupSummary(key); });
            this.logHelpText(["\r\n" + this.optionHelp, "code"]);
        };
        UsageHelpr.prototype.displayHelpGroupSummary = function (optionName) {
            var actions = this.options[optionName], action, maxTitleLength = 0, i;
            this.logger("\r\n%c" + optionName, UsageHelpr.styles.head);
            for (i = 0; i < actions.length; i += 1) {
                maxTitleLength = Math.max(maxTitleLength, this.filterHelpText(actions[i].title).length);
            }
            for (i = 0; i < actions.length; i += 1) {
                action = actions[i];
                this.logger("%c" + this.padTextRight(this.filterHelpText(action.title), maxTitleLength) + "%c  // " + action.description, UsageHelpr.styles.code, UsageHelpr.styles.comment);
            }
        };
        UsageHelpr.prototype.displayHelpOption = function (optionName) {
            var actions = this.options[optionName], action, example, maxExampleLength, i, j;
            this.logHelpText([("\r\n\r\n%c" + optionName + "\r\n-------\r\n\r\n"), "head"]);
            for (i = 0; i < actions.length; i += 1) {
                action = actions[i];
                maxExampleLength = 0;
                this.logHelpText([
                    ("%c" + action.title + "%c  ---  " + action.description),
                    "head",
                    "italic"
                ]);
                if (action.usage) {
                    this.logHelpText([
                        ("%cUsage: %c" + action.usage),
                        "comment",
                        "code"
                    ]);
                }
                if (action.examples) {
                    for (j = 0; j < action.examples.length; j += 1) {
                        example = action.examples[j];
                        this.logger("\r\n");
                        this.logHelpText([("%c// " + example.comment), "comment"]);
                        this.logHelpText([
                            ("%c" + this.padTextRight(this.filterHelpText(example.code), maxExampleLength)),
                            "code"
                        ]);
                    }
                }
                this.logger("\r\n");
            }
        };
        UsageHelpr.prototype.logHelpText = function (line) {
            if (typeof line === "string") {
                return this.logHelpText([line]);
            }
            var message = line[0], styles = line
                .slice(1)
                .filter(function (style) { return UsageHelpr.styles.hasOwnProperty(style); })
                .map(function (style) { return UsageHelpr.styles[style]; });
            this.logger.apply(this, [this.filterHelpText(message)].concat(styles, [""]));
        };
        UsageHelpr.prototype.filterHelpText = function (textRaw) {
            if (textRaw.constructor === Array) {
                return this.filterHelpText(textRaw[0]);
            }
            var text = textRaw, i;
            for (i = 0; i < this.aliases.length; i += 1) {
                text = text.replace(new RegExp(this.aliases[i][0], "g"), this.aliases[i][1]);
            }
            return text;
        };
        UsageHelpr.prototype.padTextRight = function (text, length, spacer) {
            if (spacer === void 0) { spacer = " "; }
            var diff = 1 + length - text.length;
            if (diff <= 0) {
                return text;
            }
            return text + Array.call(Array, diff).join(spacer);
        };
        UsageHelpr.styles = {
            "code": "color: #000077; font-weight: bold; font-family: Consolas, Courier New, monospace;",
            "comment": "color: #497749; font-style: italic;",
            "head": "font-weight: bold; font-size: 117%;",
            "italic": "font-style: italic;",
            "none": ""
        };
        return UsageHelpr;
    })();
    UsageHelpr_1.UsageHelpr = UsageHelpr;
})(UsageHelpr || (UsageHelpr = {}));
var UserWrappr;
(function (UserWrappr) {
    var UISchemas;
    (function (UISchemas) {
        "use strict";
        var OptionsGenerator = (function () {
            function OptionsGenerator(UserWrapper) {
                this.UserWrapper = UserWrapper;
                this.GameStarter = this.UserWrapper.getGameStarter();
            }
            OptionsGenerator.prototype.getParentControlElement = function (element) {
                if (element.className === "control" || !element.parentNode) {
                    return element;
                }
                return this.getParentControlElement(element.parentElement);
            };
            return OptionsGenerator;
        })();
        UISchemas.OptionsGenerator = OptionsGenerator;
    })(UISchemas = UserWrappr.UISchemas || (UserWrappr.UISchemas = {}));
})(UserWrappr || (UserWrappr = {}));
var UserWrappr;
(function (UserWrappr) {
    var UISchemas;
    (function (UISchemas) {
        "use strict";
        var ButtonsGenerator = (function (_super) {
            __extends(ButtonsGenerator, _super);
            function ButtonsGenerator() {
                _super.apply(this, arguments);
            }
            ButtonsGenerator.prototype.generate = function (schema) {
                var output = document.createElement("div"), options = schema.options instanceof Function
                    ? schema.options.call(self, this.GameStarter)
                    : schema.options, classNameStart = "select-option options-button-option", scope = this, option, element, i;
                output.className = "select-options select-options-buttons";
                for (i = 0; i < options.length; i += 1) {
                    option = options[i];
                    element = document.createElement("div");
                    element.className = classNameStart;
                    element.textContent = option.title;
                    element.onclick = function (schema, element) {
                        if (scope.getParentControlElement(element).getAttribute("active") !== "on") {
                            return;
                        }
                        schema.callback.call(scope, scope.GameStarter, schema, element);
                        if (element.getAttribute("option-enabled") === "true") {
                            element.setAttribute("option-enabled", "false");
                            element.className = classNameStart + " option-disabled";
                        }
                        else {
                            element.setAttribute("option-enabled", "true");
                            element.className = classNameStart + " option-enabled";
                        }
                    }.bind(this, schema, element);
                    this.ensureLocalStorageButtonValue(element, option, schema);
                    if (option[schema.keyActive || "active"]) {
                        element.className += " option-enabled";
                        element.setAttribute("option-enabled", "true");
                    }
                    else if (schema.assumeInactive) {
                        element.className += " option-disabled";
                        element.setAttribute("option-enabled", "false");
                    }
                    else {
                        element.setAttribute("option-enabled", "true");
                    }
                    output.appendChild(element);
                }
                return output;
            };
            ButtonsGenerator.prototype.ensureLocalStorageButtonValue = function (child, details, schema) {
                var key = schema.title + "::" + details.title, valueDefault = details.source.call(this, this.GameStarter).toString(), value;
                child.setAttribute("localStorageKey", key);
                this.GameStarter.ItemsHolder.addItem(key, {
                    "storeLocally": true,
                    "valueDefault": valueDefault
                });
                value = this.GameStarter.ItemsHolder.getItem(key);
                if (value.toString().toLowerCase() === "true") {
                    details[schema.keyActive || "active"] = true;
                    schema.callback.call(this, this.GameStarter, schema, child);
                }
            };
            return ButtonsGenerator;
        })(UISchemas.OptionsGenerator);
        UISchemas.ButtonsGenerator = ButtonsGenerator;
    })(UISchemas = UserWrappr.UISchemas || (UserWrappr.UISchemas = {}));
})(UserWrappr || (UserWrappr = {}));
var UserWrappr;
(function (UserWrappr) {
    var UISchemas;
    (function (UISchemas) {
        "use strict";
        var LevelEditorGenerator = (function (_super) {
            __extends(LevelEditorGenerator, _super);
            function LevelEditorGenerator() {
                _super.apply(this, arguments);
            }
            LevelEditorGenerator.prototype.generate = function (schema) {
                var output = document.createElement("div"), starter = document.createElement("div"), betweenOne = document.createElement("div"), betweenTwo = document.createElement("div"), uploader = this.createUploaderDiv(), mapper = this.createMapSelectorDiv(schema), scope = this;
                output.className = "select-options select-options-level-editor";
                starter.className = "select-option select-option-large options-button-option";
                starter.innerHTML = "Start the <br /> Level Editor!";
                starter.onclick = function () {
                    scope.GameStarter.LevelEditor.enable();
                };
                betweenOne.className = betweenTwo.className = "select-option-title";
                betweenOne.innerHTML = betweenTwo.innerHTML = "<em>- or -</em><br />";
                output.appendChild(starter);
                output.appendChild(betweenOne);
                output.appendChild(uploader);
                output.appendChild(betweenTwo);
                output.appendChild(mapper);
                return output;
            };
            LevelEditorGenerator.prototype.createUploaderDiv = function () {
                var uploader = document.createElement("div"), input = document.createElement("input");
                uploader.className = "select-option select-option-large options-button-option";
                uploader.innerHTML = "Continue an<br />editor file!";
                uploader.setAttribute("textOld", uploader.textContent);
                input.type = "file";
                input.className = "select-upload-input";
                input.onchange = this.handleFileDrop.bind(this, input, uploader);
                uploader.ondragenter = this.handleFileDragEnter.bind(this, uploader);
                uploader.ondragover = this.handleFileDragOver.bind(this, uploader);
                uploader.ondragleave = input.ondragend = this.handleFileDragLeave.bind(this, uploader);
                uploader.ondrop = this.handleFileDrop.bind(this, input, uploader);
                uploader.onclick = input.click.bind(input);
                uploader.appendChild(input);
                return uploader;
            };
            LevelEditorGenerator.prototype.createMapSelectorDiv = function (schema) {
                var expanded = true, generatorName = "MapsGrid", container = this.GameStarter.createElement("div", {
                    "className": "select-options-group select-options-editor-maps-selector"
                }), toggler = this.GameStarter.createElement("div", {
                    "className": "select-option select-option-large options-button-option"
                }), mapsOut = this.GameStarter.createElement("div", {
                    "className": "select-options-holder select-options-editor-maps-holder"
                }), mapsIn = this.UserWrapper.getGenerators()[generatorName].generate(this.GameStarter.proliferate({
                    "callback": schema.callback
                }, schema.maps));
                toggler.onclick = function (event) {
                    expanded = !expanded;
                    if (expanded) {
                        toggler.textContent = "(cancel)";
                        mapsOut.style.position = "";
                        mapsIn.style.height = "";
                    }
                    else {
                        toggler.innerHTML = "Edit a <br />built-in map!";
                        mapsOut.style.position = "absolute";
                        mapsIn.style.height = "0";
                    }
                    if (!container.parentElement) {
                        return;
                    }
                    [].slice.call(container.parentElement.children)
                        .forEach(function (element) {
                        if (element !== container) {
                            element.style.display = (expanded ? "none" : "block");
                        }
                    });
                };
                toggler.onclick(null);
                mapsOut.appendChild(mapsIn);
                container.appendChild(toggler);
                container.appendChild(mapsOut);
                return container;
            };
            LevelEditorGenerator.prototype.handleFileDragEnter = function (uploader, event) {
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = "copy";
                }
                uploader.className += " hovering";
            };
            LevelEditorGenerator.prototype.handleFileDragOver = function (uploader, event) {
                event.preventDefault();
                return false;
            };
            LevelEditorGenerator.prototype.handleFileDragLeave = function (uploader, event) {
                if (event.dataTransfer) {
                    event.dataTransfer.dropEffect = "none";
                }
                uploader.className = uploader.className.replace(" hovering", "");
            };
            LevelEditorGenerator.prototype.handleFileDrop = function (input, uploader, event) {
                var files = input.files || event.dataTransfer.files, file = files[0], reader = new FileReader();
                this.handleFileDragLeave(input, event);
                event.preventDefault();
                event.stopPropagation();
                reader.onprogress = this.handleFileUploadProgress.bind(this, file, uploader);
                reader.onloadend = this.handleFileUploadCompletion.bind(this, file, uploader);
                reader.readAsText(file);
            };
            LevelEditorGenerator.prototype.handleFileUploadProgress = function (file, uploader, event) {
                if (!event.lengthComputable) {
                    return;
                }
                var percent = Math.round((event.loaded / event.total) * 100);
                if (percent > 100) {
                    percent = 100;
                }
                uploader.innerText = "Uploading '" + file.name + "' (" + percent + "%)...";
            };
            LevelEditorGenerator.prototype.handleFileUploadCompletion = function (file, uploader, event) {
                this.GameStarter.LevelEditor.handleUploadCompletion(event);
                uploader.innerText = uploader.getAttribute("textOld");
            };
            return LevelEditorGenerator;
        })(UISchemas.OptionsGenerator);
        UISchemas.LevelEditorGenerator = LevelEditorGenerator;
    })(UISchemas = UserWrappr.UISchemas || (UserWrappr.UISchemas = {}));
})(UserWrappr || (UserWrappr = {}));
var UserWrappr;
(function (UserWrappr) {
    var UISchemas;
    (function (UISchemas) {
        "use strict";
        var MapsGridGenerator = (function (_super) {
            __extends(MapsGridGenerator, _super);
            function MapsGridGenerator() {
                _super.apply(this, arguments);
            }
            MapsGridGenerator.prototype.generate = function (schema) {
                var output = document.createElement("div");
                output.className = "select-options select-options-maps-grid";
                if (schema.rangeX && schema.rangeY) {
                    output.appendChild(this.generateRangedTable(schema));
                }
                if (schema.extras) {
                    this.appendExtras(output, schema);
                }
                return output;
            };
            MapsGridGenerator.prototype.generateRangedTable = function (schema) {
                var scope = this, table = document.createElement("table"), rangeX = schema.rangeX, rangeY = schema.rangeY, row, cell, i, j;
                for (i = rangeY[0]; i <= rangeY[1]; i += 1) {
                    row = document.createElement("tr");
                    row.className = "maps-grid-row";
                    for (j = rangeX[0]; j <= rangeX[1]; j += 1) {
                        cell = document.createElement("td");
                        cell.className = "select-option maps-grid-option maps-grid-option-range";
                        cell.textContent = i + "-" + j;
                        cell.onclick = (function (callback) {
                            if (scope.getParentControlElement(cell).getAttribute("active") === "on") {
                                callback();
                            }
                        }).bind(scope, schema.callback.bind(scope, scope.GameStarter, schema, cell));
                        row.appendChild(cell);
                    }
                    table.appendChild(row);
                }
                return table;
            };
            MapsGridGenerator.prototype.appendExtras = function (output, schema) {
                var element, extra, i, j;
                for (i = 0; i < schema.extras.length; i += 1) {
                    extra = schema.extras[i];
                    element = document.createElement("div");
                    element.className = "select-option maps-grid-option maps-grid-option-extra";
                    element.textContent = extra.title;
                    element.setAttribute("value", extra.title);
                    element.onclick = extra.callback.bind(this, this.GameStarter, schema, element);
                    output.appendChild(element);
                    if (extra.extraElements) {
                        for (j = 0; j < extra.extraElements.length; j += 1) {
                            output.appendChild(this.GameStarter.createElement(extra.extraElements[j].tag, extra.extraElements[j].options));
                        }
                    }
                }
            };
            return MapsGridGenerator;
        })(UISchemas.OptionsGenerator);
        UISchemas.MapsGridGenerator = MapsGridGenerator;
    })(UISchemas = UserWrappr.UISchemas || (UserWrappr.UISchemas = {}));
})(UserWrappr || (UserWrappr = {}));
var UserWrappr;
(function (UserWrappr) {
    var UISchemas;
    (function (UISchemas) {
        "use strict";
        var TableGenerator = (function (_super) {
            __extends(TableGenerator, _super);
            function TableGenerator() {
                _super.apply(this, arguments);
            }
            TableGenerator.prototype.generate = function (schema) {
                var output = document.createElement("div"), table = document.createElement("table"), option, action, row, label, input, child, i;
                output.className = "select-options select-options-table";
                if (schema.options) {
                    for (i = 0; i < schema.options.length; i += 1) {
                        row = document.createElement("tr");
                        label = document.createElement("td");
                        input = document.createElement("td");
                        option = schema.options[i];
                        label.className = "options-label-" + option.type;
                        label.textContent = option.title;
                        input.className = "options-cell-" + option.type;
                        row.appendChild(label);
                        row.appendChild(input);
                        child = TableGenerator.optionTypes[schema.options[i].type].call(this, input, option, schema);
                        if (option.storeLocally) {
                            this.ensureLocalStorageInputValue(child, option, schema);
                        }
                        table.appendChild(row);
                    }
                }
                output.appendChild(table);
                if (schema.actions) {
                    for (i = 0; i < schema.actions.length; i += 1) {
                        row = document.createElement("div");
                        action = schema.actions[i];
                        row.className = "select-option options-button-option";
                        row.textContent = action.title;
                        row.onclick = action.action.bind(this, this.GameStarter);
                        output.appendChild(row);
                    }
                }
                return output;
            };
            TableGenerator.prototype.setBooleanInput = function (input, details, schema) {
                var status = details.source.call(this, this.GameStarter), statusClass = status ? "enabled" : "disabled", scope = this;
                input.className = "select-option options-button-option option-" + statusClass;
                input.textContent = status ? "on" : "off";
                input.onclick = function () {
                    input.setValue(input.textContent === "off");
                };
                input.setValue = function (newStatus) {
                    if (newStatus.constructor === String) {
                        if (newStatus === "false" || newStatus === "off") {
                            newStatus = false;
                        }
                        else if (newStatus === "true" || newStatus === "on") {
                            newStatus = true;
                        }
                    }
                    if (newStatus) {
                        details.enable.call(scope, scope.GameStarter);
                        input.textContent = "on";
                        input.className = input.className.replace("disabled", "enabled");
                    }
                    else {
                        details.disable.call(scope, scope.GameStarter);
                        input.textContent = "off";
                        input.className = input.className.replace("enabled", "disabled");
                    }
                    if (details.storeLocally) {
                        scope.storeLocalStorageValue(input, newStatus.toString());
                    }
                };
                return input;
            };
            TableGenerator.prototype.setKeyInput = function (input, details, schema) {
                var values = details.source.call(this, this.GameStarter), possibleKeys = this.UserWrapper.getAllPossibleKeys(), children = [], child, scope = this, valueLower, i, j;
                for (i = 0; i < values.length; i += 1) {
                    valueLower = values[i].toLowerCase();
                    child = document.createElement("select");
                    child.className = "options-key-option";
                    child.value = child.valueOld = valueLower;
                    for (j = 0; j < possibleKeys.length; j += 1) {
                        child.appendChild(new Option(possibleKeys[j]));
                        if (possibleKeys[j] === valueLower) {
                            child.selectedIndex = j;
                        }
                    }
                    child.onchange = (function (child) {
                        details.callback.call(scope, scope.GameStarter, child.valueOld, child.value);
                        if (details.storeLocally) {
                            scope.storeLocalStorageValue(child, child.value);
                        }
                    }).bind(undefined, child);
                    children.push(child);
                    input.appendChild(child);
                }
                return children;
            };
            TableGenerator.prototype.setNumberInput = function (input, details, schema) {
                var child = document.createElement("input"), scope = this;
                child.type = "number";
                child.value = Number(details.source.call(scope, scope.GameStarter)).toString();
                child.min = (details.minimum || 0).toString();
                child.max = (details.maximum || Math.max(details.minimum + 10, 10)).toString();
                child.onchange = child.oninput = function () {
                    if (child.checkValidity()) {
                        details.update.call(scope, scope.GameStarter, child.value);
                    }
                    if (details.storeLocally) {
                        scope.storeLocalStorageValue(child, child.value);
                    }
                };
                input.appendChild(child);
                return child;
            };
            TableGenerator.prototype.setSelectInput = function (input, details, schema) {
                var child = document.createElement("select"), options = details.options(this.GameStarter), scope = this, i;
                for (i = 0; i < options.length; i += 1) {
                    child.appendChild(new Option(options[i]));
                }
                child.value = details.source.call(scope, scope.GameStarter);
                child.onchange = function () {
                    details.update.call(scope, scope.GameStarter, child.value);
                    child.blur();
                    if (details.storeLocally) {
                        scope.storeLocalStorageValue(child, child.value);
                    }
                };
                input.appendChild(child);
                return child;
            };
            TableGenerator.prototype.setScreenSizeInput = function (input, details, schema) {
                var scope = this, child;
                details.options = function () {
                    return Object.keys(scope.UserWrapper.getSizes());
                };
                details.source = function () {
                    return scope.UserWrapper.getCurrentSize().name;
                };
                details.update = function (GameStarter, value) {
                    if (value === scope.UserWrapper.getCurrentSize()) {
                        return undefined;
                    }
                    scope.UserWrapper.setCurrentSize(value);
                };
                child = scope.setSelectInput(input, details, schema);
                return child;
            };
            TableGenerator.prototype.ensureLocalStorageInputValue = function (childRaw, details, schema) {
                if (childRaw.constructor === Array) {
                    this.ensureLocalStorageValues(childRaw, details, schema);
                    return;
                }
                var child = childRaw, key = schema.title + "::" + details.title, valueDefault = details.source.call(this, this.GameStarter).toString(), value;
                child.setAttribute("localStorageKey", key);
                this.GameStarter.ItemsHolder.addItem(key, {
                    "storeLocally": true,
                    "valueDefault": valueDefault
                });
                value = this.GameStarter.ItemsHolder.getItem(key);
                if (value !== "" && value !== child.value) {
                    child.value = value;
                    if (child.setValue) {
                        child.setValue(value);
                    }
                    else if (child.onchange) {
                        child.onchange(undefined);
                    }
                    else if (child.onclick) {
                        child.onclick(undefined);
                    }
                }
            };
            TableGenerator.prototype.ensureLocalStorageValues = function (children, details, schema) {
                var keyGeneral = schema.title + "::" + details.title, values = details.source.call(this, this.GameStarter), key, value, child, i;
                for (i = 0; i < children.length; i += 1) {
                    key = keyGeneral + "::" + i;
                    child = children[i];
                    child.setAttribute("localStorageKey", key);
                    this.GameStarter.ItemsHolder.addItem(key, {
                        "storeLocally": true,
                        "valueDefault": values[i]
                    });
                    value = this.GameStarter.ItemsHolder.getItem(key);
                    if (value !== "" && value !== child.value) {
                        child.value = value;
                        if (child.onchange) {
                            child.onchange(undefined);
                        }
                        else if (child.onclick) {
                            child.onclick(undefined);
                        }
                    }
                }
            };
            TableGenerator.prototype.storeLocalStorageValue = function (child, value) {
                var key = child.getAttribute("localStorageKey");
                if (key) {
                    this.GameStarter.ItemsHolder.setItem(key, value);
                    this.GameStarter.ItemsHolder.saveItem(key);
                }
            };
            TableGenerator.optionTypes = {
                "Boolean": TableGenerator.prototype.setBooleanInput,
                "Keys": TableGenerator.prototype.setKeyInput,
                "Number": TableGenerator.prototype.setNumberInput,
                "Select": TableGenerator.prototype.setSelectInput,
                "ScreenSize": TableGenerator.prototype.setScreenSizeInput
            };
            return TableGenerator;
        })(UISchemas.OptionsGenerator);
        UISchemas.TableGenerator = TableGenerator;
    })(UISchemas = UserWrappr.UISchemas || (UserWrappr.UISchemas = {}));
})(UserWrappr || (UserWrappr = {}));
var UserWrappr;
(function (UserWrappr_1) {
    "use strict";
    var UserWrappr = (function () {
        function UserWrappr(settings) {
            this.documentElement = document.documentElement;
            this.requestFullScreen = (this.documentElement.requestFullScreen
                || this.documentElement.webkitRequestFullScreen
                || this.documentElement.mozRequestFullScreen
                || this.documentElement.msRequestFullscreen
                || function () {
                    alert("Not able to request full screen...");
                }).bind(this.documentElement);
            this.cancelFullScreen = (this.documentElement.cancelFullScreen
                || this.documentElement.webkitCancelFullScreen
                || this.documentElement.mozCancelFullScreen
                || this.documentElement.msCancelFullScreen
                || function () {
                    alert("Not able to cancel full screen...");
                }).bind(document);
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to UserWrappr.");
            }
            if (typeof settings.GameStartrConstructor === "undefined") {
                throw new Error("No GameStartrConstructor given to UserWrappr.");
            }
            if (typeof settings.globalName === "undefined") {
                throw new Error("No globalName given to UserWrappr.");
            }
            if (typeof settings.sizes === "undefined") {
                throw new Error("No sizes given to UserWrappr.");
            }
            if (typeof settings.sizeDefault === "undefined") {
                throw new Error("No sizeDefault given to UserWrappr.");
            }
            if (typeof settings.schemas === "undefined") {
                throw new Error("No schemas given to UserWrappr.");
            }
            this.settings = settings;
            this.GameStartrConstructor = settings.GameStartrConstructor;
            this.globalName = settings.globalName;
            this.sizes = this.importSizes(settings.sizes);
            this.customs = settings.customs || {};
            this.gameElementSelector = settings.gameElementSelector || "#game";
            this.gameControlsSelector = settings.gameControlsSelector || "#controls";
            this.logger = settings.logger || console.log.bind(console);
            this.isFullScreen = false;
            this.setCurrentSize(this.sizes[settings.sizeDefault]);
            this.allPossibleKeys = settings.allPossibleKeys || UserWrappr.allPossibleKeys;
            this.GameStartrConstructor.prototype.proliferate(this.customs, this.currentSize, true);
            this.resetGameStarter(settings, this.customs);
        }
        UserWrappr.prototype.resetGameStarter = function (settings, customs) {
            if (customs === void 0) { customs = {}; }
            this.loadGameStarter(this.fixCustoms(customs));
            window[settings.globalName] = this.GameStarter;
            this.GameStarter.UserWrapper = this;
            this.loadGenerators();
            this.loadControls(settings.schemas);
            if (settings.styleSheet) {
                this.GameStarter.addPageStyles(settings.styleSheet);
            }
            this.resetPageVisibilityHandlers();
            this.GameStarter.gameStart();
            this.startCheckingDevices();
        };
        UserWrappr.prototype.getGameStartrConstructor = function () {
            return this.GameStartrConstructor;
        };
        UserWrappr.prototype.getGameStarter = function () {
            return this.GameStarter;
        };
        UserWrappr.prototype.getItemsHolder = function () {
            return this.ItemsHolder;
        };
        UserWrappr.prototype.getSettings = function () {
            return this.settings;
        };
        UserWrappr.prototype.getCustoms = function () {
            return this.customs;
        };
        UserWrappr.prototype.getAllPossibleKeys = function () {
            return this.allPossibleKeys;
        };
        UserWrappr.prototype.getSizes = function () {
            return this.sizes;
        };
        UserWrappr.prototype.getCurrentSize = function () {
            return this.currentSize;
        };
        UserWrappr.prototype.getIsFullScreen = function () {
            return this.isFullScreen;
        };
        UserWrappr.prototype.getIsPageHidden = function () {
            return this.isPageHidden;
        };
        UserWrappr.prototype.getLogger = function () {
            return this.logger;
        };
        UserWrappr.prototype.getGenerators = function () {
            return this.generators;
        };
        UserWrappr.prototype.getDocumentElement = function () {
            return this.documentElement;
        };
        UserWrappr.prototype.getRequestFullScreen = function () {
            return this.requestFullScreen;
        };
        UserWrappr.prototype.getCancelFullScreen = function () {
            return this.cancelFullScreen;
        };
        UserWrappr.prototype.getDeviceChecker = function () {
            return this.deviceChecker;
        };
        UserWrappr.prototype.setCurrentSize = function (size) {
            if (typeof size === "string" || size.constructor === String) {
                if (!this.sizes.hasOwnProperty(size)) {
                    throw new Error("Size " + size + " does not exist on the UserWrappr.");
                }
                size = this.sizes[size];
            }
            this.customs = this.fixCustoms(this.customs);
            if (size.full) {
                this.requestFullScreen();
                this.isFullScreen = true;
            }
            else if (this.isFullScreen) {
                this.cancelFullScreen();
                this.isFullScreen = false;
            }
            this.currentSize = size;
            if (this.GameStarter) {
                this.GameStarter.container.parentNode.removeChild(this.GameStarter.container);
                this.resetGameStarter(this.settings, this.customs);
            }
        };
        UserWrappr.prototype.startCheckingDevices = function () {
            this.checkDevices();
        };
        UserWrappr.prototype.checkDevices = function () {
            this.deviceChecker = setTimeout(this.checkDevices.bind(this), this.GameStarter.GamesRunner.getPaused()
                ? 117
                : this.GameStarter.GamesRunner.getInterval() / this.GameStarter.GamesRunner.getSpeed());
            this.GameStarter.DeviceLayer.checkNavigatorGamepads();
            this.GameStarter.DeviceLayer.activateAllGamepadTriggers();
        };
        UserWrappr.prototype.importSizes = function (sizesRaw) {
            var sizes = this.GameStartrConstructor.prototype.proliferate({}, sizesRaw), i;
            for (i in sizes) {
                if (sizes.hasOwnProperty(i)) {
                    sizes[i].name = sizes[i].name || i;
                }
            }
            return sizes;
        };
        UserWrappr.prototype.fixCustoms = function (customsRaw) {
            var customs = this.GameStartrConstructor.prototype.proliferate({}, customsRaw);
            this.GameStartrConstructor.prototype.proliferate(customs, this.currentSize);
            if (!isFinite(customs.width)) {
                customs.width = document.body.clientWidth;
            }
            if (!isFinite(customs.height)) {
                if (customs.full) {
                    customs.height = screen.height;
                }
                else if (this.isFullScreen) {
                    customs.height = window.innerHeight - 140;
                }
                else {
                    customs.height = window.innerHeight;
                }
                customs.height -= 126;
            }
            return customs;
        };
        UserWrappr.prototype.resetPageVisibilityHandlers = function () {
            document.addEventListener("visibilitychange", this.handleVisibilityChange.bind(this));
        };
        UserWrappr.prototype.handleVisibilityChange = function () {
            switch (document.visibilityState) {
                case "hidden":
                    this.onPageHidden();
                    return;
                case "visible":
                    this.onPageVisible();
                    return;
                default:
                    return;
            }
        };
        UserWrappr.prototype.onPageHidden = function () {
            if (!this.GameStarter.GamesRunner.getPaused()) {
                this.isPageHidden = true;
                this.GameStarter.GamesRunner.pause();
            }
        };
        UserWrappr.prototype.onPageVisible = function () {
            if (this.isPageHidden) {
                this.isPageHidden = false;
                this.GameStarter.GamesRunner.play();
            }
        };
        UserWrappr.prototype.loadGameStarter = function (customs) {
            var section = document.querySelector(this.gameElementSelector);
            if (this.GameStarter) {
                this.GameStarter.GamesRunner.pause();
            }
            this.GameStarter = new this.GameStartrConstructor(customs);
            section.textContent = "";
            section.appendChild(this.GameStarter.container);
            this.GameStarter.proliferate(document.body, {
                "onkeydown": this.GameStarter.InputWriter.makePipe("onkeydown", "keyCode"),
                "onkeyup": this.GameStarter.InputWriter.makePipe("onkeyup", "keyCode")
            });
            this.GameStarter.proliferate(section, {
                "onmousedown": this.GameStarter.InputWriter.makePipe("onmousedown", "which"),
                "oncontextmenu": this.GameStarter.InputWriter.makePipe("oncontextmenu", null, true)
            });
        };
        UserWrappr.prototype.loadGenerators = function () {
            this.generators = {
                OptionsButtons: new UserWrappr_1.UISchemas.ButtonsGenerator(this),
                OptionsTable: new UserWrappr_1.UISchemas.TableGenerator(this),
                LevelEditor: new UserWrappr_1.UISchemas.LevelEditorGenerator(this),
                MapsGrid: new UserWrappr_1.UISchemas.MapsGridGenerator(this)
            };
        };
        UserWrappr.prototype.loadControls = function (schemas) {
            var section = document.querySelector(this.gameControlsSelector), length = schemas.length, i;
            this.ItemsHolder = new ItemsHoldr.ItemsHoldr({
                "prefix": this.globalName + "::UserWrapper::ItemsHolder"
            });
            section.textContent = "";
            section.className = "length-" + length;
            for (i = 0; i < length; i += 1) {
                section.appendChild(this.loadControlDiv(schemas[i]));
            }
        };
        UserWrappr.prototype.loadControlDiv = function (schema) {
            var control = document.createElement("div"), heading = document.createElement("h4"), inner = document.createElement("div");
            control.className = "control";
            control.id = "control-" + schema.title;
            heading.textContent = schema.title;
            inner.className = "control-inner";
            inner.appendChild(this.generators[schema.generator].generate(schema));
            control.appendChild(heading);
            control.appendChild(inner);
            control.onmouseover = function () {
                setTimeout(function () {
                    control.setAttribute("active", "on");
                }, 35);
            };
            control.onmouseout = function () {
                control.setAttribute("active", "off");
            };
            return control;
        };
        UserWrappr.allPossibleKeys = [
            "a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m",
            "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z",
            "up", "right", "down", "left", "space", "shift", "ctrl"
        ];
        return UserWrappr;
    })();
    UserWrappr_1.UserWrappr = UserWrappr;
})(UserWrappr || (UserWrappr = {}));
var WorldSeedr;
(function (WorldSeedr) {
    "use strict";
    var SpacingCalculator = (function () {
        function SpacingCalculator(randomBetween, chooseAmong) {
            this.randomBetween = randomBetween;
            this.chooseAmong = chooseAmong;
        }
        SpacingCalculator.prototype.calculateFromSpacing = function (spacing) {
            if (!spacing) {
                return 0;
            }
            switch (spacing.constructor) {
                case Array:
                    if (spacing[0].constructor === Number) {
                        return this.randomBetween(spacing[0], spacing[1]);
                    }
                    return this.calculateFromPossibilities(spacing);
                case Object:
                    return this.calculateFromPossibility(spacing);
                case Number:
                    return spacing;
                default:
                    throw new Error("Unknown spacing requested: '" + spacing + "'.");
            }
        };
        SpacingCalculator.prototype.calculateFromPossibility = function (spacing) {
            var spacingObject = spacing, min = spacingObject.min, max = spacingObject.max, units = spacingObject.units || 1;
            return this.randomBetween(min / units, max / units) * units;
        };
        SpacingCalculator.prototype.calculateFromPossibilities = function (spacing) {
            return this.calculateFromPossibility(this.chooseAmong(spacing).value);
        };
        return SpacingCalculator;
    })();
    WorldSeedr.SpacingCalculator = SpacingCalculator;
})(WorldSeedr || (WorldSeedr = {}));
var WorldSeedr;
(function (WorldSeedr_1) {
    "use strict";
    var directionOpposites = {
        "top": "bottom",
        "right": "left",
        "bottom": "top",
        "left": "right"
    };
    var directionSizing = {
        "top": "height",
        "right": "width",
        "bottom": "height",
        "left": "width"
    };
    var directionNames = ["top", "right", "bottom", "left"];
    var sizingNames = ["width", "height"];
    var WorldSeedr = (function () {
        function WorldSeedr(settings) {
            if (typeof settings === "undefined") {
                throw new Error("No settings object given to WorldSeedr.");
            }
            if (typeof settings.possibilities === "undefined") {
                throw new Error("No possibilities given to WorldSeedr.");
            }
            this.possibilities = settings.possibilities;
            this.random = settings.random || Math.random.bind(Math);
            this.onPlacement = settings.onPlacement || console.log.bind(console, "Got:");
            this.spacingCalculator = new WorldSeedr_1.SpacingCalculator(this.randomBetween.bind(this), this.chooseAmong.bind(this));
            this.clearGeneratedCommands();
        }
        WorldSeedr.prototype.getPossibilities = function () {
            return this.possibilities;
        };
        WorldSeedr.prototype.setPossibilities = function (possibilities) {
            this.possibilities = possibilities;
        };
        WorldSeedr.prototype.getOnPlacement = function () {
            return this.onPlacement;
        };
        WorldSeedr.prototype.setOnPlacement = function (onPlacement) {
            this.onPlacement = onPlacement;
        };
        WorldSeedr.prototype.clearGeneratedCommands = function () {
            this.generatedCommands = [];
        };
        WorldSeedr.prototype.runGeneratedCommands = function () {
            this.onPlacement(this.generatedCommands);
        };
        WorldSeedr.prototype.generate = function (name, command) {
            var schema = this.possibilities[name];
            if (!schema) {
                throw new Error("No possibility exists under '" + name + "'");
            }
            if (!schema.contents) {
                throw new Error("Possibility '" + name + "' has no possibile outcomes.");
            }
            return this.generateChildren(schema, this.objectCopy(command));
        };
        WorldSeedr.prototype.generateFull = function (schema) {
            var generated = this.generate(schema.title, schema), child, i;
            if (!generated || !generated.children) {
                return;
            }
            for (i = 0; i < generated.children.length; i += 1) {
                child = generated.children[i];
                switch (child.type) {
                    case "Known":
                        this.generatedCommands.push(child);
                        break;
                    case "Random":
                        this.generateFull(child);
                        break;
                    default:
                        throw new Error("Unknown child type: " + child.type);
                }
            }
        };
        WorldSeedr.prototype.generateChildren = function (schema, position, direction) {
            var contents = schema.contents, spacing = contents.spacing || 0, objectMerged = this.objectMerge(schema, position), children;
            direction = contents.direction || direction;
            switch (contents.mode) {
                case "Random":
                    children = this.generateRandom(contents, objectMerged, direction, spacing);
                    break;
                case "Certain":
                    children = this.generateCertain(contents, objectMerged, direction, spacing);
                    break;
                case "Repeat":
                    children = this.generateRepeat(contents, objectMerged, direction, spacing);
                    break;
                case "Multiple":
                    children = this.generateMultiple(contents, objectMerged, direction, spacing);
                    break;
                default:
                    throw new Error("Unknown contents mode: " + contents.mode);
            }
            return this.wrapChoicePositionExtremes(children);
        };
        WorldSeedr.prototype.generateCertain = function (contents, position, direction, spacing) {
            var scope = this;
            return contents.children
                .map(function (choice) {
                if (choice.type === "Final") {
                    return scope.parseChoiceFinal(choice, position, direction);
                }
                var output = scope.parseChoice(choice, position, direction);
                if (output) {
                    if (output.type !== "Known") {
                        output.contents = scope.generate(output.title, position);
                    }
                    scope.shrinkPositionByChild(position, output, direction, spacing);
                }
                return output;
            })
                .filter(function (child) {
                return child !== undefined;
            });
        };
        WorldSeedr.prototype.generateRepeat = function (contents, position, direction, spacing) {
            var choices = contents.children, children = [], choice, child, i = 0;
            while (this.positionIsNotEmpty(position, direction)) {
                choice = choices[i];
                if (choice.type === "Final") {
                    child = this.parseChoiceFinal(choice, position, direction);
                }
                else {
                    child = this.parseChoice(choice, position, direction);
                    if (child && child.type !== "Known") {
                        child.contents = this.generate(child.title, position);
                    }
                }
                if (child && this.choiceFitsPosition(child, position)) {
                    this.shrinkPositionByChild(position, child, direction, spacing);
                    children.push(child);
                }
                else {
                    break;
                }
                i += 1;
                if (i >= choices.length) {
                    i = 0;
                }
            }
            return children;
        };
        WorldSeedr.prototype.generateRandom = function (contents, position, direction, spacing) {
            var children = [], child;
            while (this.positionIsNotEmpty(position, direction)) {
                child = this.generateChild(contents, position, direction);
                if (!child) {
                    break;
                }
                this.shrinkPositionByChild(position, child, direction, spacing);
                children.push(child);
                if (contents.limit && children.length > contents.limit) {
                    return;
                }
            }
            return children;
        };
        WorldSeedr.prototype.generateMultiple = function (contents, position, direction, spacing) {
            var scope = this;
            return contents.children.map(function (choice) {
                var output = scope.parseChoice(choice, scope.objectCopy(position), direction);
                if (direction) {
                    scope.movePositionBySpacing(position, direction, spacing);
                }
                return output;
            });
        };
        WorldSeedr.prototype.generateChild = function (contents, position, direction) {
            var choice = this.chooseAmongPosition(contents.children, position);
            if (!choice) {
                return undefined;
            }
            return this.parseChoice(choice, position, direction);
        };
        WorldSeedr.prototype.parseChoice = function (choice, position, direction) {
            var title = choice.title, schema = this.possibilities[title], output = {
                "title": title,
                "type": choice.type,
                "arguments": choice.arguments instanceof Array
                    ? (this.chooseAmong(choice.arguments)).values
                    : choice.arguments,
                "width": undefined,
                "height": undefined,
                "top": undefined,
                "right": undefined,
                "bottom": undefined,
                "left": undefined
            };
            this.ensureSizingOnChoice(output, choice, schema);
            this.ensureDirectionBoundsOnChoice(output, position);
            output[direction] = output[directionOpposites[direction]] + output[directionSizing[direction]];
            switch (schema.contents.snap) {
                case "top":
                    output.bottom = output.top - output.height;
                    break;
                case "right":
                    output.left = output.right - output.width;
                    break;
                case "bottom":
                    output.top = output.bottom + output.height;
                    break;
                case "left":
                    output.right = output.left + output.width;
                    break;
                default:
                    break;
            }
            if (choice.stretch) {
                if (!output.arguments) {
                    output.arguments = {};
                }
                if (choice.stretch.width) {
                    output.left = position.left;
                    output.right = position.right;
                    output.width = output.right - output.left;
                    output.arguments.width = output.width;
                }
                if (choice.stretch.height) {
                    output.top = position.top;
                    output.bottom = position.bottom;
                    output.height = output.top - output.bottom;
                    output.arguments.height = output.height;
                }
            }
            return output;
        };
        WorldSeedr.prototype.parseChoiceFinal = function (choice, position, direction) {
            var schema = this.possibilities[choice.source], output = {
                "type": "Known",
                "title": choice.title,
                "arguments": choice.arguments,
                "width": schema.width,
                "height": schema.height,
                "top": position.top,
                "right": position.right,
                "bottom": position.bottom,
                "left": position.left
            };
            return output;
        };
        WorldSeedr.prototype.chooseAmong = function (choices) {
            if (!choices.length) {
                return undefined;
            }
            if (choices.length === 1) {
                return choices[0];
            }
            var choice = this.randomPercentage(), sum = 0, i;
            for (i = 0; i < choices.length; i += 1) {
                sum += choices[i].percent;
                if (sum >= choice) {
                    return choices[i];
                }
            }
        };
        WorldSeedr.prototype.chooseAmongPosition = function (choices, position) {
            var width = position.right - position.left, height = position.top - position.bottom, scope = this;
            return this.chooseAmong(choices.filter(function (choice) {
                return scope.choiceFitsSize(scope.possibilities[choice.title], width, height);
            }));
        };
        WorldSeedr.prototype.choiceFitsSize = function (choice, width, height) {
            return choice.width <= width && choice.height <= height;
        };
        WorldSeedr.prototype.choiceFitsPosition = function (choice, position) {
            return this.choiceFitsSize(choice, position.right - position.left, position.top - position.bottom);
        };
        WorldSeedr.prototype.positionIsNotEmpty = function (position, direction) {
            if (direction === "right" || direction === "left") {
                return position.left < position.right;
            }
            else {
                return position.top > position.bottom;
            }
        };
        WorldSeedr.prototype.shrinkPositionByChild = function (position, child, direction, spacing) {
            if (spacing === void 0) { spacing = 0; }
            switch (direction) {
                case "top":
                    position.bottom = child.top + this.spacingCalculator.calculateFromSpacing(spacing);
                    break;
                case "right":
                    position.left = child.right + this.spacingCalculator.calculateFromSpacing(spacing);
                    break;
                case "bottom":
                    position.top = child.bottom - this.spacingCalculator.calculateFromSpacing(spacing);
                    break;
                case "left":
                    position.right = child.left - this.spacingCalculator.calculateFromSpacing(spacing);
                    break;
                default:
                    break;
            }
        };
        WorldSeedr.prototype.movePositionBySpacing = function (position, direction, spacing) {
            if (spacing === void 0) { spacing = 0; }
            var space = this.spacingCalculator.calculateFromSpacing(spacing);
            switch (direction) {
                case "top":
                    position.top += space;
                    position.bottom += space;
                    break;
                case "right":
                    position.left += space;
                    position.right += space;
                    break;
                case "bottom":
                    position.top -= space;
                    position.bottom -= space;
                    break;
                case "left":
                    position.left -= space;
                    position.right -= space;
                    break;
                default:
                    throw new Error("Unknown direction: " + direction);
            }
        };
        WorldSeedr.prototype.wrapChoicePositionExtremes = function (children) {
            var position, child, i;
            if (!children || !children.length) {
                return undefined;
            }
            child = children[0];
            position = {
                "title": undefined,
                "top": child.top,
                "right": child.right,
                "bottom": child.bottom,
                "left": child.left,
                "width": undefined,
                "height": undefined,
                "children": children
            };
            if (children.length === 1) {
                return position;
            }
            for (i = 1; i < children.length; i += 1) {
                child = children[i];
                if (!Object.keys(child).length) {
                    return position;
                }
                position.top = Math.max(position.top, child.top);
                position.right = Math.max(position.right, child.right);
                position.bottom = Math.min(position.bottom, child.bottom);
                position.left = Math.min(position.left, child.left);
            }
            position.width = position.right - position.left;
            position.height = position.top - position.bottom;
            return position;
        };
        WorldSeedr.prototype.ensureSizingOnChoice = function (output, choice, schema) {
            var name, i;
            for (i in sizingNames) {
                if (!sizingNames.hasOwnProperty(i)) {
                    continue;
                }
                name = sizingNames[i];
                output[name] = (choice.sizing && typeof choice.sizing[name] !== "undefined")
                    ? choice.sizing[name]
                    : schema[name];
            }
        };
        WorldSeedr.prototype.ensureDirectionBoundsOnChoice = function (output, position) {
            var i;
            for (i in directionNames) {
                if (directionNames.hasOwnProperty(i)) {
                    output[directionNames[i]] = position[directionNames[i]];
                }
            }
        };
        WorldSeedr.prototype.randomPercentage = function () {
            return Math.floor(this.random() * 100) + 1;
        };
        WorldSeedr.prototype.randomBetween = function (min, max) {
            return Math.floor(this.random() * (1 + max - min)) + min;
        };
        WorldSeedr.prototype.objectCopy = function (original) {
            var output = {}, i;
            for (i in original) {
                if (original.hasOwnProperty(i)) {
                    output[i] = original[i];
                }
            }
            return output;
        };
        WorldSeedr.prototype.objectMerge = function (primary, secondary) {
            var output = this.objectCopy(primary), i;
            for (i in secondary) {
                if (secondary.hasOwnProperty(i) && !output.hasOwnProperty(i)) {
                    output[i] = secondary[i];
                }
            }
            return output;
        };
        return WorldSeedr;
    })();
    WorldSeedr_1.WorldSeedr = WorldSeedr;
})(WorldSeedr || (WorldSeedr = {}));
(function () {
    var acorn = {};
    (function (exports) {
        var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
        var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
        var nonASCIIidentifierChars = "\u0300-\u036f\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
        var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
        var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
        var newline = /[\n\r\u2028\u2029]/;
        var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;
        var isIdentifierStart = exports.isIdentifierStart = function (code) {
            if (code < 65)
                return code === 36;
            if (code < 91)
                return true;
            if (code < 97)
                return code === 95;
            if (code < 123)
                return true;
            return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
        };
        var isIdentifierChar = exports.isIdentifierChar = function (code) {
            if (code < 48)
                return code === 36;
            if (code < 58)
                return true;
            if (code < 65)
                return false;
            if (code < 91)
                return true;
            if (code < 97)
                return code === 95;
            if (code < 123)
                return true;
            return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
        };
    })(acorn);
    function js_beautify(js_source_text, options) {
        "use strict";
        var beautifier = new Beautifier(js_source_text, options);
        return beautifier.beautify();
    }
    function Beautifier(js_source_text, options) {
        "use strict";
        var input, output_lines;
        var token_text, token_type, last_type, last_last_text, indent_string;
        var flags, previous_flags, flag_store;
        var whitespace, wordchar, punct, parser_pos, line_starters, reserved_words, digits;
        var prefix;
        var input_wanted_newline;
        var output_space_before_token;
        var input_length, n_newlines, whitespace_before_token;
        var handlers, MODE, opt;
        var preindent_string = '';
        whitespace = "\n\r\t ".split('');
        wordchar = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_$'.split('');
        digits = '0123456789'.split('');
        punct = '+ - * / % & ++ -- = += -= *= /= %= == === != !== > < >= <= >> << >>> >>>= >>= <<= && &= | || ! ~ , : ? ^ ^= |= :: =>';
        punct += ' <%= <% %> <?= <? ?>';
        punct = punct.split(' ');
        line_starters = 'continue,try,throw,return,var,let,const,if,switch,case,default,for,while,break,function,yield'.split(',');
        reserved_words = line_starters.concat(['do', 'in', 'else', 'get', 'set', 'new', 'catch', 'finally', 'typeof']);
        MODE = {
            BlockStatement: 'BlockStatement',
            Statement: 'Statement',
            ObjectLiteral: 'ObjectLiteral',
            ArrayLiteral: 'ArrayLiteral',
            ForInitializer: 'ForInitializer',
            Conditional: 'Conditional',
            Expression: 'Expression'
        };
        handlers = {
            'TK_START_EXPR': handle_start_expr,
            'TK_END_EXPR': handle_end_expr,
            'TK_START_BLOCK': handle_start_block,
            'TK_END_BLOCK': handle_end_block,
            'TK_WORD': handle_word,
            'TK_RESERVED': handle_word,
            'TK_SEMICOLON': handle_semicolon,
            'TK_STRING': handle_string,
            'TK_EQUALS': handle_equals,
            'TK_OPERATOR': handle_operator,
            'TK_COMMA': handle_comma,
            'TK_BLOCK_COMMENT': handle_block_comment,
            'TKInLINE_COMMENT': handleInline_comment,
            'TK_COMMENT': handle_comment,
            'TK_DOT': handle_dot,
            'TK_UNKNOWN': handle_unknown
        };
        function create_flags(flags_base, mode) {
            var nextIndent_level = 0;
            if (flags_base) {
                nextIndent_level = flags_base.indentation_level;
                if (!justAdded_newline() &&
                    flags_base.lineIndent_level > nextIndent_level) {
                    nextIndent_level = flags_base.lineIndent_level;
                }
            }
            var next_flags = {
                mode: mode,
                parent: flags_base,
                last_text: flags_base ? flags_base.last_text : '',
                last_word: flags_base ? flags_base.last_word : '',
                declaration_statement: false,
                declaration_assignment: false,
                in_html_comment: false,
                multiline_frame: false,
                if_block: false,
                else_block: false,
                do_block: false,
                do_while: false,
                in_case_statement: false,
                in_case: false,
                case_body: false,
                indentation_level: nextIndent_level,
                lineIndent_level: flags_base ? flags_base.lineIndent_level : nextIndent_level,
                start_lineIndex: output_lines.length,
                had_comment: false,
                ternary_depth: 0
            };
            return next_flags;
        }
        function createOutput_line() {
            return {
                text: []
            };
        }
        options = options ? options : {};
        opt = {};
        if (options.spaceAfter_anon_function !== undefined && options.jslint_happy === undefined) {
            options.jslint_happy = options.spaceAfter_anon_function;
        }
        if (options.braces_on_own_line !== undefined) {
            opt.brace_style = options.braces_on_own_line ? "expand" : "collapse";
        }
        opt.brace_style = options.brace_style ? options.brace_style : (opt.brace_style ? opt.brace_style : "collapse");
        if (opt.brace_style === "expand-strict") {
            opt.brace_style = "expand";
        }
        opt.indent_size = options.indent_size ? parseInt(options.indent_size, 10) : 4;
        opt.indent_char = options.indent_char ? options.indent_char : ' ';
        opt.preserve_newlines = (options.preserve_newlines === undefined) ? true : options.preserve_newlines;
        opt.break_chained_methods = (options.break_chained_methods === undefined) ? false : options.break_chained_methods;
        opt.max_preserve_newlines = (options.max_preserve_newlines === undefined) ? 0 : parseInt(options.max_preserve_newlines, 10);
        opt.spaceIn_paren = (options.spaceIn_paren === undefined) ? false : options.spaceIn_paren;
        opt.spaceIn_empty_paren = (options.spaceIn_empty_paren === undefined) ? false : options.spaceIn_empty_paren;
        opt.jslint_happy = (options.jslint_happy === undefined) ? false : options.jslint_happy;
        opt.keep_arrayIndentation = (options.keep_arrayIndentation === undefined) ? false : options.keep_arrayIndentation;
        opt.space_before_conditional = (options.space_before_conditional === undefined) ? true : options.space_before_conditional;
        opt.unescape_strings = (options.unescape_strings === undefined) ? false : options.unescape_strings;
        opt.wrap_line_length = (options.wrap_line_length === undefined) ? 0 : parseInt(options.wrap_line_length, 10);
        opt.e4x = (options.e4x === undefined) ? false : options.e4x;
        if (options.indent_with_tabs) {
            opt.indent_char = '\t';
            opt.indent_size = 1;
        }
        indent_string = '';
        while (opt.indent_size > 0) {
            indent_string += opt.indent_char;
            opt.indent_size -= 1;
        }
        while (js_source_text && (js_source_text.charAt(0) === ' ' || js_source_text.charAt(0) === '\t')) {
            preindent_string += js_source_text.charAt(0);
            js_source_text = js_source_text.substring(1);
        }
        input = js_source_text;
        input_length = js_source_text.length;
        last_type = 'TK_START_BLOCK';
        last_last_text = '';
        output_lines = [createOutput_line()];
        output_space_before_token = false;
        whitespace_before_token = [];
        flag_store = [];
        set_mode(MODE.BlockStatement);
        parser_pos = 0;
        this.beautify = function () {
            var t, i, keep_whitespace, sweet_code;
            while (true) {
                t = get_next_token();
                token_text = t[0];
                token_type = t[1];
                if (token_type === 'TK_EOF') {
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    break;
                }
                keep_whitespace = opt.keep_arrayIndentation && is_array(flags.mode);
                input_wanted_newline = n_newlines > 0;
                if (keep_whitespace) {
                    for (i = 0; i < n_newlines; i += 1) {
                        print_newline(i > 0);
                    }
                }
                else {
                    if (opt.max_preserve_newlines && n_newlines > opt.max_preserve_newlines) {
                        n_newlines = opt.max_preserve_newlines;
                    }
                    if (opt.preserve_newlines) {
                        if (n_newlines > 1) {
                            print_newline();
                            for (i = 1; i < n_newlines; i += 1) {
                                print_newline(true);
                            }
                        }
                    }
                }
                handlers[token_type]();
                if (token_type !== 'TKInLINE_COMMENT' && token_type !== 'TK_COMMENT' &&
                    token_type !== 'TK_BLOCK_COMMENT' && token_type !== 'TK_UNKNOWN') {
                    last_last_text = flags.last_text;
                    last_type = token_type;
                    flags.last_text = token_text;
                }
                flags.had_comment = (token_type === 'TKInLINE_COMMENT' || token_type === 'TK_COMMENT'
                    || token_type === 'TK_BLOCK_COMMENT');
            }
            sweet_code = output_lines[0].text.join('');
            for (var lineIndex = 1; lineIndex < output_lines.length; lineIndex++) {
                sweet_code += '\n' + output_lines[lineIndex].text.join('');
            }
            sweet_code = sweet_code.replace(/[\r\n ]+$/, '');
            return sweet_code;
        };
        function trimOutput(eat_newlines) {
            eat_newlines = (eat_newlines === undefined) ? false : eat_newlines;
            if (output_lines.length) {
                trimOutput_line(output_lines[output_lines.length - 1]);
                while (eat_newlines && output_lines.length > 1 &&
                    output_lines[output_lines.length - 1].text.length === 0) {
                    output_lines.pop();
                    trimOutput_line(output_lines[output_lines.length - 1]);
                }
            }
        }
        function trimOutput_line(line) {
            while (line.text.length &&
                (line.text[line.text.length - 1] === ' ' ||
                    line.text[line.text.length - 1] === indent_string ||
                    line.text[line.text.length - 1] === preindent_string)) {
                line.text.pop();
            }
        }
        function trim(s) {
            return s.replace(/^\s+|\s+$/g, '');
        }
        function split_newlines(s) {
            s = s.replace(/\x0d/g, '');
            var out = [], idx = s.indexOf("\n");
            while (idx !== -1) {
                out.push(s.substring(0, idx));
                s = s.substring(idx + 1);
                idx = s.indexOf("\n");
            }
            if (s.length) {
                out.push(s);
            }
            return out;
        }
        function justAdded_newline() {
            var line = output_lines[output_lines.length - 1];
            return line.text.length === 0;
        }
        function justAdded_blankline() {
            if (justAdded_newline()) {
                if (output_lines.length === 1) {
                    return true;
                }
                var line = output_lines[output_lines.length - 2];
                return line.text.length === 0;
            }
            return false;
        }
        function allow_wrap_or_preserved_newline(force_linewrap) {
            force_linewrap = (force_linewrap === undefined) ? false : force_linewrap;
            if (opt.wrap_line_length && !force_linewrap) {
                var line = output_lines[output_lines.length - 1];
                var proposed_line_length = 0;
                if (line.text.length > 0) {
                    proposed_line_length = line.text.join('').length + token_text.length +
                        (output_space_before_token ? 1 : 0);
                    if (proposed_line_length >= opt.wrap_line_length) {
                        force_linewrap = true;
                    }
                }
            }
            if (((opt.preserve_newlines && input_wanted_newline) || force_linewrap) && !justAdded_newline()) {
                print_newline(false, true);
            }
        }
        function print_newline(force_newline, preserve_statement_flags) {
            output_space_before_token = false;
            if (!preserve_statement_flags) {
                if (flags.last_text !== ';' && flags.last_text !== ',' && flags.last_text !== '=' && last_type !== 'TK_OPERATOR') {
                    while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                        restore_mode();
                    }
                }
            }
            if (output_lines.length === 1 && justAdded_newline()) {
                return;
            }
            if (force_newline || !justAdded_newline()) {
                flags.multiline_frame = true;
                output_lines.push(createOutput_line());
            }
        }
        function print_token_lineIndentation() {
            if (justAdded_newline()) {
                var line = output_lines[output_lines.length - 1];
                if (opt.keep_arrayIndentation && is_array(flags.mode) && input_wanted_newline) {
                    line.text.push('');
                    for (var i = 0; i < whitespace_before_token.length; i += 1) {
                        line.text.push(whitespace_before_token[i]);
                    }
                }
                else {
                    if (preindent_string) {
                        line.text.push(preindent_string);
                    }
                    printIndent_string(flags.indentation_level);
                }
            }
        }
        function printIndent_string(level) {
            if (output_lines.length > 1) {
                var line = output_lines[output_lines.length - 1];
                flags.lineIndent_level = level;
                for (var i = 0; i < level; i += 1) {
                    line.text.push(indent_string);
                }
            }
        }
        function print_token_space_before() {
            var line = output_lines[output_lines.length - 1];
            if (output_space_before_token && line.text.length) {
                var lastOutput = line.text[line.text.length - 1];
                if (lastOutput !== ' ' && lastOutput !== indent_string) {
                    line.text.push(' ');
                }
            }
        }
        function print_token(printable_token) {
            printable_token = printable_token || token_text;
            print_token_lineIndentation();
            print_token_space_before();
            output_space_before_token = false;
            output_lines[output_lines.length - 1].text.push(printable_token);
        }
        function indent() {
            flags.indentation_level += 1;
        }
        function deindent() {
            if (flags.indentation_level > 0 &&
                ((!flags.parent) || flags.indentation_level > flags.parent.indentation_level))
                flags.indentation_level -= 1;
        }
        function remove_redundantIndentation(frame) {
            if (frame.multiline_frame)
                return;
            var index = frame.start_lineIndex;
            var spliceIndex = 0;
            var line;
            while (index < output_lines.length) {
                line = output_lines[index];
                index++;
                if (line.text.length === 0) {
                    continue;
                }
                if (preindent_string && line.text[0] === preindent_string) {
                    spliceIndex = 1;
                }
                else {
                    spliceIndex = 0;
                }
                if (line.text[spliceIndex] === indent_string) {
                    line.text.splice(spliceIndex, 1);
                }
            }
        }
        function set_mode(mode) {
            if (flags) {
                flag_store.push(flags);
                previous_flags = flags;
            }
            else {
                previous_flags = create_flags(null, mode);
            }
            flags = create_flags(previous_flags, mode);
        }
        function is_array(mode) {
            return mode === MODE.ArrayLiteral;
        }
        function is_expression(mode) {
            return in_array(mode, [MODE.Expression, MODE.ForInitializer, MODE.Conditional]);
        }
        function restore_mode() {
            if (flag_store.length > 0) {
                previous_flags = flags;
                flags = flag_store.pop();
                if (previous_flags.mode === MODE.Statement) {
                    remove_redundantIndentation(previous_flags);
                }
            }
        }
        function start_of_object_property() {
            return flags.parent.mode === MODE.ObjectLiteral && flags.mode === MODE.Statement && flags.last_text === ':' &&
                flags.ternary_depth === 0;
        }
        function start_of_statement() {
            if ((last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && token_type === 'TK_WORD') ||
                (last_type === 'TK_RESERVED' && flags.last_text === 'do') ||
                (last_type === 'TK_RESERVED' && flags.last_text === 'return' && !input_wanted_newline) ||
                (last_type === 'TK_RESERVED' && flags.last_text === 'else' && !(token_type === 'TK_RESERVED' && token_text === 'if')) ||
                (last_type === 'TK_END_EXPR' && (previous_flags.mode === MODE.ForInitializer || previous_flags.mode === MODE.Conditional)) ||
                (last_type === 'TK_WORD' && flags.mode === MODE.BlockStatement
                    && !flags.in_case
                    && !(token_text === '--' || token_text === '++')
                    && token_type !== 'TK_WORD' && token_type !== 'TK_RESERVED') ||
                (flags.mode === MODE.ObjectLiteral && flags.last_text === ':' && flags.ternary_depth === 0)) {
                set_mode(MODE.Statement);
                indent();
                if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const']) && token_type === 'TK_WORD') {
                    flags.declaration_statement = true;
                }
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline(token_type === 'TK_RESERVED' && in_array(token_text, ['do', 'for', 'if', 'while']));
                }
                return true;
            }
            return false;
        }
        function all_lines_start_with(lines, c) {
            for (var i = 0; i < lines.length; i++) {
                var line = trim(lines[i]);
                if (line.charAt(0) !== c) {
                    return false;
                }
            }
            return true;
        }
        function each_line_matchesIndent(lines, indent) {
            var i = 0, len = lines.length, line;
            for (; i < len; i++) {
                line = lines[i];
                if (line && line.indexOf(indent) !== 0) {
                    return false;
                }
            }
            return true;
        }
        function is_special_word(word) {
            return in_array(word, ['case', 'return', 'do', 'if', 'throw', 'else']);
        }
        function in_array(what, arr) {
            for (var i = 0; i < arr.length; i += 1) {
                if (arr[i] === what) {
                    return true;
                }
            }
            return false;
        }
        function unescape_string(s) {
            var esc = false, out = '', pos = 0, s_hex = '', escaped = 0, c;
            while (esc || pos < s.length) {
                c = s.charAt(pos);
                pos++;
                if (esc) {
                    esc = false;
                    if (c === 'x') {
                        s_hex = s.substr(pos, 2);
                        pos += 2;
                    }
                    else if (c === 'u') {
                        s_hex = s.substr(pos, 4);
                        pos += 4;
                    }
                    else {
                        out += '\\' + c;
                        continue;
                    }
                    if (!s_hex.match(/^[0123456789abcdefABCDEF]+$/)) {
                        return s;
                    }
                    escaped = parseInt(s_hex, 16);
                    if (escaped >= 0x00 && escaped < 0x20) {
                        if (c === 'x') {
                            out += '\\x' + s_hex;
                        }
                        else {
                            out += '\\u' + s_hex;
                        }
                        continue;
                    }
                    else if (escaped === 0x22 || escaped === 0x27 || escaped === 0x5c) {
                        out += '\\' + String.fromCharCode(escaped);
                    }
                    else if (c === 'x' && escaped > 0x7e && escaped <= 0xff) {
                        return s;
                    }
                    else {
                        out += String.fromCharCode(escaped);
                    }
                }
                else if (c === '\\') {
                    esc = true;
                }
                else {
                    out += c;
                }
            }
            return out;
        }
        function is_next(find) {
            var local_pos = parser_pos;
            var c = input.charAt(local_pos);
            while (in_array(c, whitespace) && c !== find) {
                local_pos++;
                if (local_pos >= input_length) {
                    return false;
                }
                c = input.charAt(local_pos);
            }
            return c === find;
        }
        function get_next_token() {
            var i, resulting_string;
            n_newlines = 0;
            if (parser_pos >= input_length) {
                return ['', 'TK_EOF'];
            }
            input_wanted_newline = false;
            whitespace_before_token = [];
            var c = input.charAt(parser_pos);
            parser_pos += 1;
            while (in_array(c, whitespace)) {
                if (c === '\n') {
                    n_newlines += 1;
                    whitespace_before_token = [];
                }
                else if (n_newlines) {
                    if (c === indent_string) {
                        whitespace_before_token.push(indent_string);
                    }
                    else if (c !== '\r') {
                        whitespace_before_token.push(' ');
                    }
                }
                if (parser_pos >= input_length) {
                    return ['', 'TK_EOF'];
                }
                c = input.charAt(parser_pos);
                parser_pos += 1;
            }
            if (acorn.isIdentifierChar(input.charCodeAt(parser_pos - 1))) {
                if (parser_pos < input_length) {
                    while (acorn.isIdentifierChar(input.charCodeAt(parser_pos))) {
                        c += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos === input_length) {
                            break;
                        }
                    }
                }
                if (parser_pos !== input_length && c.match(/^[0-9]+[Ee]$/) && (input.charAt(parser_pos) === '-' || input.charAt(parser_pos) === '+')) {
                    var sign = input.charAt(parser_pos);
                    parser_pos += 1;
                    var t = get_next_token();
                    c += sign + t[0];
                    return [c, 'TK_WORD'];
                }
                if (!(last_type === 'TK_DOT' ||
                    (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['set', 'get'])))
                    && in_array(c, reserved_words)) {
                    if (c === 'in') {
                        return [c, 'TK_OPERATOR'];
                    }
                    return [c, 'TK_RESERVED'];
                }
                return [c, 'TK_WORD'];
            }
            if (c === '(' || c === '[') {
                return [c, 'TK_START_EXPR'];
            }
            if (c === ')' || c === ']') {
                return [c, 'TK_END_EXPR'];
            }
            if (c === '{') {
                return [c, 'TK_START_BLOCK'];
            }
            if (c === '}') {
                return [c, 'TK_END_BLOCK'];
            }
            if (c === ';') {
                return [c, 'TK_SEMICOLON'];
            }
            if (c === '/') {
                var comment = '';
                var inline_comment = true;
                if (input.charAt(parser_pos) === '*') {
                    parser_pos += 1;
                    if (parser_pos < input_length) {
                        while (parser_pos < input_length && !(input.charAt(parser_pos) === '*' && input.charAt(parser_pos + 1) && input.charAt(parser_pos + 1) === '/')) {
                            c = input.charAt(parser_pos);
                            comment += c;
                            if (c === "\n" || c === "\r") {
                                inline_comment = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                break;
                            }
                        }
                    }
                    parser_pos += 2;
                    if (inline_comment && n_newlines === 0) {
                        return ['/*' + comment + '*/', 'TKInLINE_COMMENT'];
                    }
                    else {
                        return ['/*' + comment + '*/', 'TK_BLOCK_COMMENT'];
                    }
                }
                if (input.charAt(parser_pos) === '/') {
                    comment = c;
                    while (input.charAt(parser_pos) !== '\r' && input.charAt(parser_pos) !== '\n') {
                        comment += input.charAt(parser_pos);
                        parser_pos += 1;
                        if (parser_pos >= input_length) {
                            break;
                        }
                    }
                    return [comment, 'TK_COMMENT'];
                }
            }
            if (c === '`' || c === "'" || c === '"' ||
                ((c === '/') ||
                    (opt.e4x && c === "<" && input.slice(parser_pos - 1).match(/^<([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*\/?\s*>/))) && ((last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) ||
                    (last_type === 'TK_END_EXPR' && in_array(previous_flags.mode, [MODE.Conditional, MODE.ForInitializer])) ||
                    (in_array(last_type, ['TK_COMMENT', 'TK_START_EXPR', 'TK_START_BLOCK',
                        'TK_END_BLOCK', 'TK_OPERATOR', 'TK_EQUALS', 'TK_EOF', 'TK_SEMICOLON', 'TK_COMMA'
                    ])))) {
                var sep = c, esc = false, has_char_escapes = false;
                resulting_string = c;
                if (parser_pos < input_length) {
                    if (sep === '/') {
                        var in_char_class = false;
                        while (esc || in_char_class || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (!esc) {
                                esc = input.charAt(parser_pos) === '\\';
                                if (input.charAt(parser_pos) === '[') {
                                    in_char_class = true;
                                }
                                else if (input.charAt(parser_pos) === ']') {
                                    in_char_class = false;
                                }
                            }
                            else {
                                esc = false;
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    }
                    else if (opt.e4x && sep === '<') {
                        var xmlRegExp = /<(\/?)([-a-zA-Z:0-9_.]+|{[^{}]*}|!\[CDATA\[[\s\S]*?\]\])\s*([-a-zA-Z:0-9_.]+=('[^']*'|"[^"]*"|{[^{}]*})\s*)*(\/?)\s*>/g;
                        var xmlStr = input.slice(parser_pos - 1);
                        var match = xmlRegExp.exec(xmlStr);
                        if (match && match.index === 0) {
                            var rootTag = match[2];
                            var depth = 0;
                            while (match) {
                                var isEndTag = !!match[1];
                                var tagName = match[2];
                                var isSingletonTag = (!!match[match.length - 1]) || (tagName.slice(0, 8) === "![CDATA[");
                                if (tagName === rootTag && !isSingletonTag) {
                                    if (isEndTag) {
                                        --depth;
                                    }
                                    else {
                                        ++depth;
                                    }
                                }
                                if (depth <= 0) {
                                    break;
                                }
                                match = xmlRegExp.exec(xmlStr);
                            }
                            var xmlLength = match ? match.index + match[0].length : xmlStr.length;
                            parser_pos += xmlLength - 1;
                            return [xmlStr.slice(0, xmlLength), "TK_STRING"];
                        }
                    }
                    else {
                        while (esc || input.charAt(parser_pos) !== sep) {
                            resulting_string += input.charAt(parser_pos);
                            if (esc) {
                                if (input.charAt(parser_pos) === 'x' || input.charAt(parser_pos) === 'u') {
                                    has_char_escapes = true;
                                }
                                esc = false;
                            }
                            else {
                                esc = input.charAt(parser_pos) === '\\';
                            }
                            parser_pos += 1;
                            if (parser_pos >= input_length) {
                                return [resulting_string, 'TK_STRING'];
                            }
                        }
                    }
                }
                parser_pos += 1;
                resulting_string += sep;
                if (has_char_escapes && opt.unescape_strings) {
                    resulting_string = unescape_string(resulting_string);
                }
                if (sep === '/') {
                    while (parser_pos < input_length && in_array(input.charAt(parser_pos), wordchar)) {
                        resulting_string += input.charAt(parser_pos);
                        parser_pos += 1;
                    }
                }
                return [resulting_string, 'TK_STRING'];
            }
            if (c === '#') {
                if (output_lines.length === 1 && output_lines[0].text.length === 0 &&
                    input.charAt(parser_pos) === '!') {
                    resulting_string = c;
                    while (parser_pos < input_length && c !== '\n') {
                        c = input.charAt(parser_pos);
                        resulting_string += c;
                        parser_pos += 1;
                    }
                    return [trim(resulting_string) + '\n', 'TK_UNKNOWN'];
                }
                var sharp = '#';
                if (parser_pos < input_length && in_array(input.charAt(parser_pos), digits)) {
                    do {
                        c = input.charAt(parser_pos);
                        sharp += c;
                        parser_pos += 1;
                    } while (parser_pos < input_length && c !== '#' && c !== '=');
                    if (c === '#') {
                    }
                    else if (input.charAt(parser_pos) === '[' && input.charAt(parser_pos + 1) === ']') {
                        sharp += '[]';
                        parser_pos += 2;
                    }
                    else if (input.charAt(parser_pos) === '{' && input.charAt(parser_pos + 1) === '}') {
                        sharp += '{}';
                        parser_pos += 2;
                    }
                    return [sharp, 'TK_WORD'];
                }
            }
            if (c === '<' && input.substring(parser_pos - 1, parser_pos + 3) === '<!--') {
                parser_pos += 3;
                c = '<!--';
                while (input.charAt(parser_pos) !== '\n' && parser_pos < input_length) {
                    c += input.charAt(parser_pos);
                    parser_pos++;
                }
                flags.in_html_comment = true;
                return [c, 'TK_COMMENT'];
            }
            if (c === '-' && flags.in_html_comment && input.substring(parser_pos - 1, parser_pos + 2) === '-->') {
                flags.in_html_comment = false;
                parser_pos += 2;
                return ['-->', 'TK_COMMENT'];
            }
            if (c === '.') {
                return [c, 'TK_DOT'];
            }
            if (in_array(c, punct)) {
                while (parser_pos < input_length && in_array(c + input.charAt(parser_pos), punct)) {
                    c += input.charAt(parser_pos);
                    parser_pos += 1;
                    if (parser_pos >= input_length) {
                        break;
                    }
                }
                if (c === ',') {
                    return [c, 'TK_COMMA'];
                }
                else if (c === '=') {
                    return [c, 'TK_EQUALS'];
                }
                else {
                    return [c, 'TK_OPERATOR'];
                }
            }
            return [c, 'TK_UNKNOWN'];
        }
        function handle_start_expr() {
            if (start_of_statement()) {
            }
            var next_mode = MODE.Expression;
            if (token_text === '[') {
                if (last_type === 'TK_WORD' || flags.last_text === ')') {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, line_starters)) {
                        output_space_before_token = true;
                    }
                    set_mode(next_mode);
                    print_token();
                    indent();
                    if (opt.spaceIn_paren) {
                        output_space_before_token = true;
                    }
                    return;
                }
                next_mode = MODE.ArrayLiteral;
                if (is_array(flags.mode)) {
                    if (flags.last_text === '[' ||
                        (flags.last_text === ',' && (last_last_text === ']' || last_last_text === '}'))) {
                        if (!opt.keep_arrayIndentation) {
                            print_newline();
                        }
                    }
                }
            }
            else {
                if (last_type === 'TK_RESERVED' && flags.last_text === 'for') {
                    next_mode = MODE.ForInitializer;
                }
                else if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['if', 'while'])) {
                    next_mode = MODE.Conditional;
                }
                else {
                }
            }
            if (flags.last_text === ';' || last_type === 'TK_START_BLOCK') {
                print_newline();
            }
            else if (last_type === 'TK_END_EXPR' || last_type === 'TK_START_EXPR' || last_type === 'TK_END_BLOCK' || flags.last_text === '.') {
                allow_wrap_or_preserved_newline(input_wanted_newline);
            }
            else if (!(last_type === 'TK_RESERVED' && token_text === '(') && last_type !== 'TK_WORD' && last_type !== 'TK_OPERATOR') {
                output_space_before_token = true;
            }
            else if ((last_type === 'TK_RESERVED' && (flags.last_word === 'function' || flags.last_word === 'typeof')) ||
                (flags.last_text === '*' && last_last_text === 'function')) {
                if (opt.jslint_happy) {
                    output_space_before_token = true;
                }
            }
            else if (last_type === 'TK_RESERVED' && (in_array(flags.last_text, line_starters) || flags.last_text === 'catch')) {
                if (opt.space_before_conditional) {
                    output_space_before_token = true;
                }
            }
            if (token_text === '(') {
                if (last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                    if (!start_of_object_property()) {
                        allow_wrap_or_preserved_newline();
                    }
                }
            }
            set_mode(next_mode);
            print_token();
            if (opt.spaceIn_paren) {
                output_space_before_token = true;
            }
            indent();
        }
        function handle_end_expr() {
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }
            if (flags.multiline_frame) {
                allow_wrap_or_preserved_newline(token_text === ']' && is_array(flags.mode) && !opt.keep_arrayIndentation);
            }
            if (opt.spaceIn_paren) {
                if (last_type === 'TK_START_EXPR' && !opt.spaceIn_empty_paren) {
                    trimOutput();
                    output_space_before_token = false;
                }
                else {
                    output_space_before_token = true;
                }
            }
            if (token_text === ']' && opt.keep_arrayIndentation) {
                print_token();
                restore_mode();
            }
            else {
                restore_mode();
                print_token();
            }
            remove_redundantIndentation(previous_flags);
            if (flags.do_while && previous_flags.mode === MODE.Conditional) {
                previous_flags.mode = MODE.Expression;
                flags.do_block = false;
                flags.do_while = false;
            }
        }
        function handle_start_block() {
            set_mode(MODE.BlockStatement);
            var empty_braces = is_next('}');
            var empty_anonymous_function = empty_braces && flags.last_word === 'function' &&
                last_type === 'TK_END_EXPR';
            if (opt.brace_style === "expand") {
                if (last_type !== 'TK_OPERATOR' &&
                    (empty_anonymous_function ||
                        last_type === 'TK_EQUALS' ||
                        (last_type === 'TK_RESERVED' && is_special_word(flags.last_text) && flags.last_text !== 'else'))) {
                    output_space_before_token = true;
                }
                else {
                    print_newline(false, true);
                }
            }
            else {
                if (last_type !== 'TK_OPERATOR' && last_type !== 'TK_START_EXPR') {
                    if (last_type === 'TK_START_BLOCK') {
                        print_newline();
                    }
                    else {
                        output_space_before_token = true;
                    }
                }
                else {
                    if (is_array(previous_flags.mode) && flags.last_text === ',') {
                        if (last_last_text === '}') {
                            output_space_before_token = true;
                        }
                        else {
                            print_newline();
                        }
                    }
                }
            }
            print_token();
            indent();
        }
        function handle_end_block() {
            while (flags.mode === MODE.Statement) {
                restore_mode();
            }
            var empty_braces = last_type === 'TK_START_BLOCK';
            if (opt.brace_style === "expand") {
                if (!empty_braces) {
                    print_newline();
                }
            }
            else {
                if (!empty_braces) {
                    if (is_array(flags.mode) && opt.keep_arrayIndentation) {
                        opt.keep_arrayIndentation = false;
                        print_newline();
                        opt.keep_arrayIndentation = true;
                    }
                    else {
                        print_newline();
                    }
                }
            }
            restore_mode();
            print_token();
        }
        function handle_word() {
            if (start_of_statement()) {
            }
            else if (input_wanted_newline && !is_expression(flags.mode) &&
                (last_type !== 'TK_OPERATOR' || (flags.last_text === '--' || flags.last_text === '++')) &&
                last_type !== 'TK_EQUALS' &&
                (opt.preserve_newlines || !(last_type === 'TK_RESERVED' && in_array(flags.last_text, ['var', 'let', 'const', 'set', 'get'])))) {
                print_newline();
            }
            if (flags.do_block && !flags.do_while) {
                if (token_type === 'TK_RESERVED' && token_text === 'while') {
                    output_space_before_token = true;
                    print_token();
                    output_space_before_token = true;
                    flags.do_while = true;
                    return;
                }
                else {
                    print_newline();
                    flags.do_block = false;
                }
            }
            if (flags.if_block) {
                if (!flags.else_block && (token_type === 'TK_RESERVED' && token_text === 'else')) {
                    flags.else_block = true;
                }
                else {
                    while (flags.mode === MODE.Statement) {
                        restore_mode();
                    }
                    flags.if_block = false;
                    flags.else_block = false;
                }
            }
            if (token_type === 'TK_RESERVED' && (token_text === 'case' || (token_text === 'default' && flags.in_case_statement))) {
                print_newline();
                if (flags.case_body || opt.jslint_happy) {
                    deindent();
                    flags.case_body = false;
                }
                print_token();
                flags.in_case = true;
                flags.in_case_statement = true;
                return;
            }
            if (token_type === 'TK_RESERVED' && token_text === 'function') {
                if (in_array(flags.last_text, ['}', ';']) || (justAdded_newline() && !in_array(flags.last_text, ['[', '{', ':', '=', ',']))) {
                    if (!justAdded_blankline() && !flags.had_comment) {
                        print_newline();
                        print_newline(true);
                    }
                }
                if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                    if (last_type === 'TK_RESERVED' && in_array(flags.last_text, ['get', 'set', 'new', 'return'])) {
                        output_space_before_token = true;
                    }
                    else {
                        print_newline();
                    }
                }
                else if (last_type === 'TK_OPERATOR' || flags.last_text === '=') {
                    output_space_before_token = true;
                }
                else if (is_expression(flags.mode)) {
                }
                else {
                    print_newline();
                }
            }
            if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            }
            if (token_type === 'TK_RESERVED' && token_text === 'function') {
                print_token();
                flags.last_word = token_text;
                return;
            }
            prefix = 'NONE';
            if (last_type === 'TK_END_BLOCK') {
                if (!(token_type === 'TK_RESERVED' && in_array(token_text, ['else', 'catch', 'finally']))) {
                    prefix = 'NEWLINE';
                }
                else {
                    if (opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                        prefix = 'NEWLINE';
                    }
                    else {
                        prefix = 'SPACE';
                        output_space_before_token = true;
                    }
                }
            }
            else if (last_type === 'TK_SEMICOLON' && flags.mode === MODE.BlockStatement) {
                prefix = 'NEWLINE';
            }
            else if (last_type === 'TK_SEMICOLON' && is_expression(flags.mode)) {
                prefix = 'SPACE';
            }
            else if (last_type === 'TK_STRING') {
                prefix = 'NEWLINE';
            }
            else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD' ||
                (flags.last_text === '*' && last_last_text === 'function')) {
                prefix = 'SPACE';
            }
            else if (last_type === 'TK_START_BLOCK') {
                prefix = 'NEWLINE';
            }
            else if (last_type === 'TK_END_EXPR') {
                output_space_before_token = true;
                prefix = 'NEWLINE';
            }
            if (token_type === 'TK_RESERVED' && in_array(token_text, line_starters) && flags.last_text !== ')') {
                if (flags.last_text === 'else') {
                    prefix = 'SPACE';
                }
                else {
                    prefix = 'NEWLINE';
                }
            }
            if (token_type === 'TK_RESERVED' && in_array(token_text, ['else', 'catch', 'finally'])) {
                if (last_type !== 'TK_END_BLOCK' || opt.brace_style === "expand" || opt.brace_style === "end-expand") {
                    print_newline();
                }
                else {
                    trimOutput(true);
                    var line = output_lines[output_lines.length - 1];
                    if (line.text[line.text.length - 1] !== '}') {
                        print_newline();
                    }
                    output_space_before_token = true;
                }
            }
            else if (prefix === 'NEWLINE') {
                if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                    output_space_before_token = true;
                }
                else if (last_type !== 'TK_END_EXPR') {
                    if ((last_type !== 'TK_START_EXPR' || !(token_type === 'TK_RESERVED' && in_array(token_text, ['var', 'let', 'const']))) && flags.last_text !== ':') {
                        if (token_type === 'TK_RESERVED' && token_text === 'if' && flags.last_word === 'else' && flags.last_text !== '{') {
                            output_space_before_token = true;
                        }
                        else {
                            print_newline();
                        }
                    }
                }
                else if (token_type === 'TK_RESERVED' && in_array(token_text, line_starters) && flags.last_text !== ')') {
                    print_newline();
                }
            }
            else if (is_array(flags.mode) && flags.last_text === ',' && last_last_text === '}') {
                print_newline();
            }
            else if (prefix === 'SPACE') {
                output_space_before_token = true;
            }
            print_token();
            flags.last_word = token_text;
            if (token_type === 'TK_RESERVED' && token_text === 'do') {
                flags.do_block = true;
            }
            if (token_type === 'TK_RESERVED' && token_text === 'if') {
                flags.if_block = true;
            }
        }
        function handle_semicolon() {
            if (start_of_statement()) {
                output_space_before_token = false;
            }
            while (flags.mode === MODE.Statement && !flags.if_block && !flags.do_block) {
                restore_mode();
            }
            print_token();
            if (flags.mode === MODE.ObjectLiteral) {
                flags.mode = MODE.BlockStatement;
            }
        }
        function handle_string() {
            if (start_of_statement()) {
                output_space_before_token = true;
            }
            else if (last_type === 'TK_RESERVED' || last_type === 'TK_WORD') {
                output_space_before_token = true;
            }
            else if (last_type === 'TK_COMMA' || last_type === 'TK_START_EXPR' || last_type === 'TK_EQUALS' || last_type === 'TK_OPERATOR') {
                if (!start_of_object_property()) {
                    allow_wrap_or_preserved_newline();
                }
            }
            else {
                print_newline();
            }
            print_token();
        }
        function handle_equals() {
            if (start_of_statement()) {
            }
            if (flags.declaration_statement) {
                flags.declaration_assignment = true;
            }
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }
        function handle_comma() {
            if (flags.declaration_statement) {
                if (is_expression(flags.parent.mode)) {
                    flags.declaration_assignment = false;
                }
                print_token();
                if (flags.declaration_assignment) {
                    flags.declaration_assignment = false;
                    print_newline(false, true);
                }
                else {
                    output_space_before_token = true;
                }
                return;
            }
            print_token();
            if (flags.mode === MODE.ObjectLiteral ||
                (flags.mode === MODE.Statement && flags.parent.mode === MODE.ObjectLiteral)) {
                if (flags.mode === MODE.Statement) {
                    restore_mode();
                }
                print_newline();
            }
            else {
                output_space_before_token = true;
            }
        }
        function handle_operator() {
            if (token_text === ':' && flags.mode === MODE.BlockStatement &&
                last_last_text === '{' &&
                (last_type === 'TK_WORD' || last_type === 'TK_RESERVED')) {
                flags.mode = MODE.ObjectLiteral;
            }
            if (start_of_statement()) {
            }
            var space_before = true;
            var spaceAfter = true;
            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                output_space_before_token = true;
                print_token();
                return;
            }
            if (token_text === '*' && last_type === 'TK_DOT' && !last_last_text.match(/^\d+$/)) {
                print_token();
                return;
            }
            if (token_text === ':' && flags.in_case) {
                flags.case_body = true;
                indent();
                print_token();
                print_newline();
                flags.in_case = false;
                return;
            }
            if (token_text === '::') {
                print_token();
                return;
            }
            if (input_wanted_newline && (token_text === '--' || token_text === '++')) {
                print_newline(false, true);
            }
            if (last_type === 'TK_OPERATOR') {
                allow_wrap_or_preserved_newline();
            }
            if (in_array(token_text, ['--', '++', '!', '~']) || (in_array(token_text, ['-', '+']) && (in_array(last_type, ['TK_START_BLOCK', 'TK_START_EXPR', 'TK_EQUALS', 'TK_OPERATOR']) || in_array(flags.last_text, line_starters) || flags.last_text === ','))) {
                space_before = false;
                spaceAfter = false;
                if (flags.last_text === ';' && is_expression(flags.mode)) {
                    space_before = true;
                }
                if (last_type === 'TK_RESERVED' || last_type === 'TK_END_EXPR') {
                    space_before = true;
                }
                if ((flags.mode === MODE.BlockStatement || flags.mode === MODE.Statement) && (flags.last_text === '{' || flags.last_text === ';')) {
                    print_newline();
                }
            }
            else if (token_text === ':') {
                if (flags.ternary_depth === 0) {
                    if (flags.mode === MODE.BlockStatement) {
                        flags.mode = MODE.ObjectLiteral;
                    }
                    space_before = false;
                }
                else {
                    flags.ternary_depth -= 1;
                }
            }
            else if (token_text === '?') {
                flags.ternary_depth += 1;
            }
            else if (token_text === '*' && last_type === 'TK_RESERVED' && flags.last_text === 'function') {
                space_before = false;
                spaceAfter = false;
            }
            output_space_before_token = output_space_before_token || space_before;
            print_token();
            output_space_before_token = spaceAfter;
        }
        function handle_block_comment() {
            var lines = split_newlines(token_text);
            var j;
            var javadoc = false;
            var starless = false;
            var lastIndent = whitespace_before_token.join('');
            var lastIndentLength = lastIndent.length;
            print_newline(false, true);
            if (lines.length > 1) {
                if (all_lines_start_with(lines.slice(1), '*')) {
                    javadoc = true;
                }
                else if (each_line_matchesIndent(lines.slice(1), lastIndent)) {
                    starless = true;
                }
            }
            print_token(lines[0]);
            for (j = 1; j < lines.length; j++) {
                print_newline(false, true);
                if (javadoc) {
                    print_token(' ' + trim(lines[j]));
                }
                else if (starless && lines[j].length > lastIndentLength) {
                    print_token(lines[j].substring(lastIndentLength));
                }
                else {
                    output_lines[output_lines.length - 1].text.push(lines[j]);
                }
            }
            print_newline(false, true);
        }
        function handleInline_comment() {
            output_space_before_token = true;
            print_token();
            output_space_before_token = true;
        }
        function handle_comment() {
            if (input_wanted_newline) {
                print_newline(false, true);
            }
            else {
                trimOutput(true);
            }
            output_space_before_token = true;
            print_token();
            print_newline(false, true);
        }
        function handle_dot() {
            if (start_of_statement()) {
            }
            if (last_type === 'TK_RESERVED' && is_special_word(flags.last_text)) {
                output_space_before_token = true;
            }
            else {
                allow_wrap_or_preserved_newline(flags.last_text === ')' && opt.break_chained_methods);
            }
            print_token();
        }
        function handle_unknown() {
            print_token();
            if (token_text[token_text.length - 1] === '\n') {
                print_newline();
            }
        }
    }
    if (typeof define === "function" && define.amd) {
        define([], function () {
            return { js_beautify: js_beautify };
        });
    }
    else if (typeof exports !== "undefined") {
        exports.js_beautify = js_beautify;
    }
    else if (typeof window !== "undefined") {
        window.js_beautify = js_beautify;
    }
    else if (typeof global !== "undefined") {
        global.js_beautify = js_beautify;
    }
}());
var GameStartr;
(function (GameStartr_1) {
    "use strict";
    var GameStartr = (function (_super) {
        __extends(GameStartr, _super);
        function GameStartr(settings, customs) {
            if (customs === void 0) { customs = {}; }
            _super.call(this, {
                "unitsize": customs.unitsize,
                "constantsSource": customs.constantsSource,
                "constants": customs.constants
            });
            this.resets = [
                "resetUsageHelper",
                "resetObjectMaker",
                "resetPixelRender",
                "resetTimeHandler",
                "resetItemsHolder",
                "resetAudioPlayer",
                "resetQuadsKeeper",
                "resetGamesRunner",
                "resetGroupHolder",
                "resetThingHitter",
                "resetMapScreener",
                "resetPixelDrawer",
                "resetNumberMaker",
                "resetMapsCreator",
                "resetAreaSpawner",
                "resetInputWriter",
                "resetDeviceLayer",
                "resetTouchPasser",
                "resetLevelEditor",
                "resetWorldSeeder",
                "resetScenePlayer",
                "resetMathDecider",
                "resetModAttacher",
                "startModAttacher",
                "resetContainer"
            ];
            this.settings = settings;
            if (customs.extraResets) {
                this.resets.push.apply(this.resets, customs.extraResets);
            }
            if (customs.resetTimed) {
                this.resetTimed(this, customs);
            }
            else {
                this.reset(this, customs);
            }
        }
        GameStartr.prototype.reset = function (GameStarter, settings) {
            _super.prototype.reset.call(this, GameStarter, GameStarter.resets, settings);
        };
        GameStartr.prototype.resetTimed = function (GameStarter, settings) {
            _super.prototype.resetTimed.call(this, GameStarter, GameStarter.resets, settings);
        };
        GameStartr.prototype.resetUsageHelper = function (GameStarter, settings) {
            GameStarter.UsageHelper = new UsageHelpr.UsageHelpr(GameStarter.settings.help);
        };
        GameStartr.prototype.resetObjectMaker = function (GameStarter, settings) {
            GameStarter.ObjectMaker = new ObjectMakr.ObjectMakr(GameStarter.proliferate({
                "properties": {
                    "Quadrant": {
                        "EightBitter": GameStarter,
                        "GameStarter": GameStarter
                    },
                    "Thing": {
                        "EightBitter": GameStarter,
                        "GameStarter": GameStarter
                    }
                }
            }, GameStarter.settings.objects));
        };
        GameStartr.prototype.resetQuadsKeeper = function (GameStarter, settings) {
            var quadrantWidth = settings.width / (GameStarter.settings.quadrants.numCols - 3), quadrantHeight = settings.height / (GameStarter.settings.quadrants.numRows - 2);
            GameStarter.QuadsKeeper = new QuadsKeepr.QuadsKeepr(GameStarter.proliferate({
                "ObjectMaker": GameStarter.ObjectMaker,
                "createCanvas": GameStarter.createCanvas,
                "quadrantWidth": quadrantWidth,
                "quadrantHeight": quadrantHeight,
                "startLeft": -quadrantWidth,
                "startHeight": -quadrantHeight,
                "onAdd": GameStarter.onAreaSpawn.bind(GameStarter, GameStarter),
                "onRemove": GameStarter.onAreaUnspawn.bind(GameStarter, GameStarter)
            }, GameStarter.settings.quadrants));
        };
        GameStartr.prototype.resetPixelRender = function (GameStarter, settings) {
            GameStarter.PixelRender = new PixelRendr.PixelRendr(GameStarter.proliferate({
                "scale": GameStarter.scale,
                "QuadsKeeper": GameStarter.QuadsKeeper,
                "unitsize": GameStarter.unitsize
            }, GameStarter.settings.sprites));
        };
        GameStartr.prototype.resetPixelDrawer = function (GameStarter, settings) {
            GameStarter.PixelDrawer = new PixelDrawr.PixelDrawr(GameStarter.proliferate({
                "PixelRender": GameStarter.PixelRender,
                "MapScreener": GameStarter.MapScreener,
                "createCanvas": GameStarter.createCanvas,
                "unitsize": GameStarter.unitsize,
                "generateObjectKey": GameStarter.generateThingKey
            }, GameStarter.settings.renderer));
        };
        GameStartr.prototype.resetTimeHandler = function (GameStarter, settings) {
            GameStarter.TimeHandler = new TimeHandlr.TimeHandlr(GameStarter.proliferate({
                "classAdd": GameStarter.addClass,
                "classRemove": GameStarter.removeClass
            }, GameStarter.settings.events));
        };
        GameStartr.prototype.resetAudioPlayer = function (GameStarter, settings) {
            GameStarter.AudioPlayer = new AudioPlayr.AudioPlayr(GameStarter.proliferate({
                "ItemsHolder": GameStarter.ItemsHolder
            }, GameStarter.settings.audio));
        };
        GameStartr.prototype.resetGamesRunner = function (GameStarter, settings) {
            GameStarter.GamesRunner = new GamesRunnr.GamesRunnr(GameStarter.proliferate({
                "adjustFramerate": true,
                "scope": GameStarter,
                "onPlay": GameStarter.onGamePlay.bind(GameStarter, GameStarter),
                "onPause": GameStarter.onGamePause.bind(GameStarter, GameStarter),
                "FPSAnalyzer": new FPSAnalyzr.FPSAnalyzr()
            }, GameStarter.settings.runner));
            GameStarter.FPSAnalyzer = GameStarter.GamesRunner.getFPSAnalyzer();
        };
        GameStartr.prototype.resetItemsHolder = function (GameStarter, settings) {
            GameStarter.ItemsHolder = new ItemsHoldr.ItemsHoldr(GameStarter.proliferate({
                "callbackArgs": [GameStarter]
            }, GameStarter.settings.items));
        };
        GameStartr.prototype.resetGroupHolder = function (GameStarter, settings) {
            GameStarter.GroupHolder = new GroupHoldr.GroupHoldr(GameStarter.settings.groups);
        };
        GameStartr.prototype.resetThingHitter = function (GameStarter, settings) {
            GameStarter.ThingHitter = new ThingHittr.ThingHittr(GameStarter.proliferate({
                "scope": GameStarter
            }, GameStarter.settings.collisions));
        };
        GameStartr.prototype.resetMapScreener = function (GameStarter, settings) {
            GameStarter.MapScreener = new MapScreenr.MapScreenr({
                "EightBitter": GameStarter,
                "unitsize": GameStarter.unitsize,
                "width": settings.width,
                "height": settings.height,
                "variableArgs": [GameStarter],
                "variables": GameStarter.settings.maps.screenVariables
            });
        };
        GameStartr.prototype.resetNumberMaker = function (GameStarter, settings) {
            GameStarter.NumberMaker = new NumberMakr.NumberMakr();
        };
        GameStartr.prototype.resetMapsCreator = function (GameStarter, settings) {
            GameStarter.MapsCreator = new MapsCreatr.MapsCreatr({
                "ObjectMaker": GameStarter.ObjectMaker,
                "groupTypes": GameStarter.settings.maps.groupTypes,
                "macros": GameStarter.settings.maps.macros,
                "entrances": GameStarter.settings.maps.entrances,
                "maps": GameStarter.settings.maps.library,
                "scope": GameStarter
            });
        };
        GameStartr.prototype.resetAreaSpawner = function (GameStarter, settings) {
            GameStarter.AreaSpawner = new AreaSpawnr.AreaSpawnr({
                "MapsCreator": GameStarter.MapsCreator,
                "MapScreener": GameStarter.MapScreener,
                "screenAttributes": GameStarter.settings.maps.screenAttributes,
                "onSpawn": GameStarter.settings.maps.onSpawn,
                "onUnspawn": GameStarter.settings.maps.onUnspawn,
                "stretchAdd": GameStarter.settings.maps.stretchAdd,
                "afterAdd": GameStarter.settings.maps.afterAdd,
                "commandScope": GameStarter
            });
        };
        GameStartr.prototype.resetInputWriter = function (GameStarter, settings) {
            GameStarter.InputWriter = new InputWritr.InputWritr(GameStarter.proliferate({
                "canTrigger": GameStarter.canInputsTrigger.bind(GameStarter, GameStarter),
                "eventInformation": GameStarter
            }, GameStarter.settings.input.InputWritrArgs));
        };
        GameStartr.prototype.resetDeviceLayer = function (GameStarter, settings) {
            GameStarter.DeviceLayer = new DeviceLayr.DeviceLayr(GameStarter.proliferate({
                "InputWriter": GameStarter.InputWriter
            }, GameStarter.settings.devices));
        };
        GameStartr.prototype.resetTouchPasser = function (GameStarter, settings) {
            GameStarter.TouchPasser = new TouchPassr.TouchPassr(GameStarter.proliferate({
                "InputWriter": GameStarter.InputWriter
            }, GameStarter.settings.touch));
        };
        GameStartr.prototype.resetLevelEditor = function (GameStarter, settings) {
            GameStarter.LevelEditor = new LevelEditr.LevelEditr(GameStarter.proliferate({
                "GameStarter": GameStarter,
                "beautifier": js_beautify
            }, GameStarter.settings.editor));
        };
        GameStartr.prototype.resetWorldSeeder = function (GameStarter, settings) {
            GameStarter.WorldSeeder = new WorldSeedr.WorldSeedr(GameStarter.proliferate({
                "random": GameStarter.NumberMaker.random.bind(GameStarter.NumberMaker),
                "onPlacement": GameStarter.mapPlaceRandomCommands.bind(GameStarter, GameStarter)
            }, GameStarter.settings.generator));
        };
        GameStartr.prototype.resetScenePlayer = function (GameStarter, settings) {
            GameStarter.ScenePlayer = new ScenePlayr.ScenePlayr(GameStarter.proliferate({
                "cutsceneArguments": [GameStarter]
            }, GameStarter.settings.scenes));
        };
        GameStartr.prototype.resetMathDecider = function (GameStarter, settings) {
            GameStarter.MathDecider = new MathDecidr.MathDecidr(GameStarter.settings.math);
        };
        GameStartr.prototype.resetModAttacher = function (GameStarter, settings) {
            GameStarter.ModAttacher = new ModAttachr.ModAttachr(GameStarter.proliferate({
                "scopeDefault": GameStarter,
                "ItemsHoldr": GameStarter.ItemsHolder
            }, GameStarter.settings.mods));
        };
        GameStartr.prototype.startModAttacher = function (GameStarter, settings) {
            var mods = settings.mods, i;
            if (mods) {
                for (i in mods) {
                    if (mods.hasOwnProperty(i) && mods[i]) {
                        GameStarter.ModAttacher.enableMod(i);
                    }
                }
            }
            GameStarter.ModAttacher.fireEvent("onReady", GameStarter, GameStarter);
        };
        GameStartr.prototype.resetContainer = function (GameStarter, settings) {
            GameStarter.container = GameStarter.createElement("div", {
                "className": "EightBitter",
                "style": GameStarter.proliferate({
                    "position": "relative",
                    "width": settings.width + "px",
                    "height": settings.height + "px"
                }, settings.style)
            });
            GameStarter.canvas = GameStarter.createCanvas(settings.width, settings.height);
            GameStarter.PixelDrawer.setCanvas(GameStarter.canvas);
            GameStarter.container.appendChild(GameStarter.canvas);
            GameStarter.TouchPasser.setParentContainer(GameStarter.container);
        };
        GameStartr.prototype.scrollWindow = function (dx, dy) {
            var GameStarter = GameStartr.prototype.ensureCorrectCaller(this);
            dx = dx | 0;
            dy = dy | 0;
            if (!dx && !dy) {
                return;
            }
            GameStarter.MapScreener.shift(dx, dy);
            GameStarter.shiftAll(-dx, -dy);
            GameStarter.QuadsKeeper.shiftQuadrants(-dx, -dy);
        };
        GameStartr.prototype.scrollThing = function (thing, dx, dy) {
            var saveleft = thing.left, savetop = thing.top;
            thing.GameStarter.scrollWindow(dx, dy);
            thing.GameStarter.setLeft(thing, saveleft);
            thing.GameStarter.setTop(thing, savetop);
        };
        GameStartr.prototype.onAreaSpawn = function (GameStarter, direction, top, right, bottom, left) {
            GameStarter.AreaSpawner.spawnArea(direction, (top + GameStarter.MapScreener.top) / GameStarter.unitsize, (right + GameStarter.MapScreener.left) / GameStarter.unitsize, (bottom + GameStarter.MapScreener.top) / GameStarter.unitsize, (left + GameStarter.MapScreener.left) / GameStarter.unitsize);
        };
        GameStartr.prototype.onAreaUnspawn = function (GameStarter, direction, top, right, bottom, left) {
            GameStarter.AreaSpawner.unspawnArea(direction, (top + GameStarter.MapScreener.top) / GameStarter.unitsize, (right + GameStarter.MapScreener.left) / GameStarter.unitsize, (bottom + GameStarter.MapScreener.top) / GameStarter.unitsize, (left + GameStarter.MapScreener.left) / GameStarter.unitsize);
        };
        GameStartr.prototype.addThing = function (thingRaw, left, top) {
            if (left === void 0) { left = 0; }
            if (top === void 0) { top = 0; }
            var thing;
            if (typeof thingRaw === "string" || thingRaw instanceof String) {
                thing = this.ObjectMaker.make(thingRaw);
            }
            else if (thingRaw.constructor === Array) {
                thing = this.ObjectMaker.make.apply(this.ObjectMaker, thingRaw);
            }
            else {
                thing = thingRaw;
            }
            if (arguments.length > 2) {
                thing.GameStarter.setLeft(thing, left);
                thing.GameStarter.setTop(thing, top);
            }
            else if (arguments.length > 1) {
                thing.GameStarter.setLeft(thing, left);
            }
            thing.GameStarter.updateSize(thing);
            thing.GameStarter.GroupHolder.getFunctions().add[thing.groupType](thing);
            thing.placed = true;
            if (thing.onThingAdd) {
                thing.onThingAdd(thing);
            }
            thing.GameStarter.PixelDrawer.setThingSprite(thing);
            if (thing.onThingAdded) {
                thing.onThingAdded(thing);
            }
            thing.GameStarter.ModAttacher.fireEvent("onAddThing", thing, left, top);
            return thing;
        };
        GameStartr.prototype.thingProcess = function (thing, title, settings, defaults) {
            var maxQuads = 4, num, cycle;
            thing.title = thing.title || title;
            if (thing.width && !thing.spritewidth) {
                thing.spritewidth = defaults.spritewidth || defaults.width;
            }
            if (thing.height && !thing.spriteheight) {
                thing.spriteheight = defaults.spriteheight || defaults.height;
            }
            num = Math.floor(thing.width * (thing.GameStarter.unitsize / thing.GameStarter.QuadsKeeper.getQuadrantWidth()));
            if (num > 0) {
                maxQuads += ((num + 1) * maxQuads / 2);
            }
            num = Math.floor(thing.height * thing.GameStarter.unitsize / thing.GameStarter.QuadsKeeper.getQuadrantHeight());
            if (num > 0) {
                maxQuads += ((num + 1) * maxQuads / 2);
            }
            thing.maxquads = maxQuads;
            thing.quadrants = new Array(maxQuads);
            thing.spritewidth = thing.spritewidth || thing.width;
            thing.spriteheight = thing.spriteheight || thing.height;
            thing.spritewidthpixels = thing.spritewidth * thing.GameStarter.unitsize;
            thing.spriteheightpixels = thing.spriteheight * thing.GameStarter.unitsize;
            thing.canvas = thing.GameStarter.createCanvas(thing.spritewidthpixels, thing.spriteheightpixels);
            thing.context = thing.canvas.getContext("2d");
            if (thing.opacity !== 1) {
                thing.GameStarter.setOpacity(thing, thing.opacity);
            }
            if (thing.attributes) {
                thing.GameStarter.thingProcessAttributes(thing, thing.attributes);
            }
            if (thing.onThingMake) {
                thing.onThingMake(thing, settings);
            }
            thing.GameStarter.setSize(thing, thing.width, thing.height);
            thing.GameStarter.setClassInitial(thing, thing.name || thing.title);
            if (cycle = thing.spriteCycle) {
                thing.GameStarter.TimeHandler.addClassCycle(thing, cycle[0], cycle[1] || null, cycle[2] || null);
            }
            if (cycle = thing.spriteCycleSynched) {
                thing.GameStarter.TimeHandler.addClassCycleSynched(thing, cycle[0], cycle[1] || null, cycle[2] || null);
            }
            if (thing.flipHoriz) {
                thing.GameStarter.flipHoriz(thing);
            }
            if (thing.flipVert) {
                thing.GameStarter.flipVert(thing);
            }
            thing.GameStarter.ModAttacher.fireEvent("onThingMake", thing.GameStarter, thing, title, settings, defaults);
        };
        GameStartr.prototype.thingProcessAttributes = function (thing, attributes) {
            var attribute;
            for (attribute in attributes) {
                if (thing[attribute]) {
                    thing.GameStarter.proliferate(thing, attributes[attribute]);
                    if (thing.name) {
                        thing.name += " " + attribute;
                    }
                    else {
                        thing.name = thing.title + " " + attribute;
                    }
                }
            }
        };
        GameStartr.prototype.mapPlaceRandomCommands = function (GameStarter, generatedCommands) {
            var MapsCreator = GameStarter.MapsCreator, AreaSpawner = GameStarter.AreaSpawner, prethings = AreaSpawner.getPreThings(), area = AreaSpawner.getArea(), map = AreaSpawner.getMap(), command, output, i;
            for (i = 0; i < generatedCommands.length; i += 1) {
                command = generatedCommands[i];
                output = {
                    "thing": command.title,
                    "x": command.left,
                    "y": command.top
                };
                if (command.arguments) {
                    GameStarter.proliferateHard(output, command.arguments, true);
                }
                MapsCreator.analyzePreSwitch(output, prethings, area, map);
            }
        };
        GameStartr.prototype.onGamePlay = function (GameStarter) {
            GameStarter.AudioPlayer.resumeAll();
            GameStarter.ModAttacher.fireEvent("onGamePlay");
        };
        GameStartr.prototype.onGamePause = function (GameStarter) {
            GameStarter.AudioPlayer.pauseAll();
            GameStarter.ModAttacher.fireEvent("onGamePause");
        };
        GameStartr.prototype.canInputsTrigger = function (GameStarter) {
            return true;
        };
        GameStartr.prototype.gameStart = function () {
            this.ModAttacher.fireEvent("onGameStart");
        };
        GameStartr.prototype.killNormal = function (thing) {
            if (!thing) {
                return;
            }
            thing.alive = false;
            thing.hidden = true;
            thing.movement = undefined;
        };
        GameStartr.prototype.markChanged = function (thing) {
            thing.changed = true;
        };
        GameStartr.prototype.shiftVert = function (thing, dy, notChanged) {
            EightBittr.EightBittr.prototype.shiftVert(thing, dy);
            if (!notChanged) {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.shiftHoriz = function (thing, dx, notChanged) {
            EightBittr.EightBittr.prototype.shiftHoriz(thing, dx);
            if (!notChanged) {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.setTop = function (thing, top) {
            EightBittr.EightBittr.prototype.setTop(thing, top);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setRight = function (thing, right) {
            EightBittr.EightBittr.prototype.setRight(thing, right);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setBottom = function (thing, bottom) {
            EightBittr.EightBittr.prototype.setBottom(thing, bottom);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setLeft = function (thing, left) {
            EightBittr.EightBittr.prototype.setLeft(thing, left);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.shiftBoth = function (thing, dx, dy, notChanged) {
            dx = dx || 0;
            dy = dy || 0;
            if (!thing.noshiftx) {
                if (thing.parallaxHoriz) {
                    thing.GameStarter.shiftHoriz(thing, thing.parallaxHoriz * dx, notChanged);
                }
                else {
                    thing.GameStarter.shiftHoriz(thing, dx, notChanged);
                }
            }
            if (!thing.noshifty) {
                if (thing.parallaxVert) {
                    thing.GameStarter.shiftVert(thing, thing.parallaxVert * dy, notChanged);
                }
                else {
                    thing.GameStarter.shiftVert(thing, dy, notChanged);
                }
            }
        };
        GameStartr.prototype.shiftThings = function (things, dx, dy, notChanged) {
            for (var i = things.length - 1; i >= 0; i -= 1) {
                things[i].GameStarter.shiftBoth(things[i], dx, dy, notChanged);
            }
        };
        GameStartr.prototype.shiftAll = function (dx, dy) {
            var GameStarter = GameStartr.prototype.ensureCorrectCaller(this);
            GameStarter.GroupHolder.callAll(GameStarter, GameStarter.shiftThings, dx, dy, true);
        };
        GameStartr.prototype.setWidth = function (thing, width, updateSprite, updateSize) {
            thing.width = width;
            thing.unitwidth = width * thing.GameStarter.unitsize;
            if (updateSprite) {
                thing.spritewidth = width;
                thing.spritewidthpixels = width * thing.GameStarter.unitsize;
            }
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setHeight = function (thing, height, updateSprite, updateSize) {
            thing.height = height;
            thing.unitheight = height * thing.GameStarter.unitsize;
            if (updateSprite) {
                thing.spriteheight = height;
                thing.spriteheightpixels = height * thing.GameStarter.unitsize;
            }
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setSize = function (thing, width, height, updateSprite, updateSize) {
            thing.GameStarter.setWidth(thing, width, updateSprite, updateSize);
            thing.GameStarter.setHeight(thing, height, updateSprite, updateSize);
        };
        GameStartr.prototype.updatePosition = function (thing) {
            thing.GameStarter.shiftHoriz(thing, thing.xvel);
            thing.GameStarter.shiftVert(thing, thing.yvel);
        };
        GameStartr.prototype.updateSize = function (thing) {
            thing.unitwidth = thing.width * thing.GameStarter.unitsize;
            thing.unitheight = thing.height * thing.GameStarter.unitsize;
            thing.spritewidthpixels = thing.spritewidth * thing.GameStarter.unitsize;
            thing.spriteheightpixels = thing.spriteheight * thing.GameStarter.unitsize;
            thing.canvas.width = thing.spritewidthpixels;
            thing.canvas.height = thing.spriteheightpixels;
            thing.GameStarter.PixelDrawer.setThingSprite(thing);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.reduceWidth = function (thing, dx, updateSize) {
            thing.right -= dx;
            thing.width -= dx / thing.GameStarter.unitsize;
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            else {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.reduceHeight = function (thing, dy, updateSize) {
            thing.top += dy;
            thing.height -= dy / thing.GameStarter.unitsize;
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            else {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.increaseWidth = function (thing, dx, updateSize) {
            thing.right += dx;
            thing.width += dx / thing.GameStarter.unitsize;
            thing.unitwidth = thing.width * thing.GameStarter.unitsize;
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            else {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.increaseHeight = function (thing, dy, updateSize) {
            thing.top -= dy;
            thing.height += dy / thing.GameStarter.unitsize;
            thing.unitheight = thing.height * thing.GameStarter.unitsize;
            if (updateSize) {
                thing.GameStarter.updateSize(thing);
            }
            else {
                thing.GameStarter.markChanged(thing);
            }
        };
        GameStartr.prototype.generateThingKey = function (thing) {
            return thing.groupType + " " + thing.title + " " + thing.className;
        };
        GameStartr.prototype.setClass = function (thing, className) {
            thing.className = className;
            thing.GameStarter.PixelDrawer.setThingSprite(thing);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.setClassInitial = function (thing, className) {
            thing.className = className;
        };
        GameStartr.prototype.addClass = function (thing, className) {
            thing.className += " " + className;
            thing.GameStarter.PixelDrawer.setThingSprite(thing);
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.addClasses = function (thing) {
            var classes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                classes[_i - 1] = arguments[_i];
            }
            var adder, i, j;
            for (i = 0; i < classes.length; i += 1) {
                adder = classes[i];
                if (adder.constructor === String || typeof adder === "string") {
                    adder = adder.split(" ");
                }
                for (j = adder.length - 1; j >= 0; j -= 1) {
                    thing.GameStarter.addClass(thing, adder[j]);
                }
            }
        };
        GameStartr.prototype.removeClass = function (thing, className) {
            if (!className) {
                return;
            }
            if (className.indexOf(" ") !== -1) {
                thing.GameStarter.removeClasses(thing, className);
            }
            thing.className = thing.className.replace(new RegExp(" " + className, "gm"), "");
            thing.GameStarter.PixelDrawer.setThingSprite(thing);
        };
        GameStartr.prototype.removeClasses = function (thing) {
            var classes = [];
            for (var _i = 1; _i < arguments.length; _i++) {
                classes[_i - 1] = arguments[_i];
            }
            var adder, i, j;
            for (i = 0; i < classes.length; i += 1) {
                adder = classes[i];
                if (adder.constructor === String || typeof adder === "string") {
                    adder = adder.split(" ");
                }
                for (j = adder.length - 1; j >= 0; --j) {
                    thing.GameStarter.removeClass(thing, adder[j]);
                }
            }
        };
        GameStartr.prototype.hasClass = function (thing, className) {
            return thing.className.indexOf(className) !== -1;
        };
        GameStartr.prototype.switchClass = function (thing, classNameOut, classNameIn) {
            thing.GameStarter.removeClass(thing, classNameOut);
            thing.GameStarter.addClass(thing, classNameIn);
        };
        GameStartr.prototype.flipHoriz = function (thing) {
            thing.flipHoriz = true;
            thing.GameStarter.addClass(thing, "flipped");
        };
        GameStartr.prototype.flipVert = function (thing) {
            thing.flipVert = true;
            thing.GameStarter.addClass(thing, "flip-vert");
        };
        GameStartr.prototype.unflipHoriz = function (thing) {
            thing.flipHoriz = false;
            thing.GameStarter.removeClass(thing, "flipped");
        };
        GameStartr.prototype.unflipVert = function (thing) {
            thing.flipVert = false;
            thing.GameStarter.removeClass(thing, "flip-vert");
        };
        GameStartr.prototype.setOpacity = function (thing, opacity) {
            thing.opacity = opacity;
            thing.GameStarter.markChanged(thing);
        };
        GameStartr.prototype.ensureCorrectCaller = function (current) {
            if (!(current instanceof GameStartr)) {
                throw new Error("A function requires the scope ('this') to be the "
                    + "manipulated GameStartr object. Unfortunately, 'this' is a "
                    + typeof (this) + ".");
            }
            return current;
        };
        GameStartr.prototype.arrayDeleteThing = function (thing, array, location) {
            if (location === void 0) { location = array.indexOf(thing); }
            if (location === -1) {
                return;
            }
            array.splice(location, 1);
            if (typeof thing.onDelete === "function") {
                thing.onDelete(thing);
            }
        };
        GameStartr.prototype.takeScreenshot = function (name, format) {
            if (format === void 0) { format = "image/png"; }
            var GameStarter = GameStartr.prototype.ensureCorrectCaller(this), link = GameStarter.createElement("a", {
                "download": name + "." + format.split("/")[1],
                "href": GameStarter.canvas.toDataURL(format).replace(format, "image/octet-stream")
            });
            link.click();
        };
        GameStartr.prototype.addPageStyles = function (styles) {
            var GameStarter = GameStartr.prototype.ensureCorrectCaller(this), sheet = GameStarter.createElement("style", {
                "type": "text/css"
            }), compiled = "", i, j;
            for (i in styles) {
                if (!styles.hasOwnProperty(i)) {
                    continue;
                }
                compiled += i + " { \r\n";
                for (j in styles[i]) {
                    if (styles[i].hasOwnProperty(j)) {
                        compiled += "  " + j + ": " + styles[i][j] + ";\r\n";
                    }
                }
                compiled += "}\r\n";
            }
            if (sheet.styleSheet) {
                sheet.style.cssText = compiled;
            }
            else {
                sheet.appendChild(document.createTextNode(compiled));
            }
            document.querySelector("head").appendChild(sheet);
        };
        return GameStartr;
    })(EightBittr.EightBittr);
    GameStartr_1.GameStartr = GameStartr;
})(GameStartr || (GameStartr = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Inputs = (function () {
        function Inputs() {
        }
        Inputs.prototype.keyDownLeft = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            var player = FSM.player;
            player.keys.run = -1;
            player.keys.leftDown = true;
            player.FSM.ModAttacher.fireEvent("onKeyDownLeft");
        };
        Inputs.prototype.keyDownRight = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            var player = FSM.player;
            player.keys.run = 1;
            player.keys.rightDown = true;
            player.FSM.ModAttacher.fireEvent("onKeyDownRight");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyDownUp = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            var player = FSM.player;
            player.keys.up = true;
            if (player.canjump && (player.resting || FSM.MapScreener.underwater)) {
                player.keys.jump = true;
                player.canjump = false;
                player.keys.jumplev = 0;
                if (player.power > 1) {
                    FSM.AudioPlayer.play("Jump Super");
                }
                else {
                    FSM.AudioPlayer.play("Jump Small");
                }
                if (FSM.MapScreener.underwater) {
                    FSM.TimeHandler.addEvent(function () {
                        player.jumping = player.keys.jump = false;
                    }, 14);
                }
            }
            FSM.ModAttacher.fireEvent("onKeyDownUp");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyDownDown = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            var player = FSM.player;
            player.keys.crouch = true;
            FSM.ModAttacher.fireEvent("onKeyDownDown");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyDownSprint = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            var player = FSM.player;
            if (player.power === 3 && player.keys.sprint === false && !player.crouching) {
                player.fire(player);
            }
            player.keys.sprint = true;
            player.FSM.ModAttacher.fireEvent("onKeyDownSprint");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyDownPause = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                FSM.GamesRunner.play();
            }
            else {
                FSM.GamesRunner.pause();
            }
            FSM.ModAttacher.fireEvent("onKeyDownPause");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyDownMute = function (FSM, event) {
            if (FSM.GamesRunner.getPaused()) {
                return;
            }
            FSM.AudioPlayer.toggleMuted();
            FSM.ModAttacher.fireEvent("onKeyDownMute");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpLeft = function (FSM, event) {
            var player = FSM.player;
            player.keys.run = 0;
            player.keys.leftDown = false;
            FSM.ModAttacher.fireEvent("onKeyUpLeft");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpRight = function (FSM, event) {
            var player = FSM.player;
            player.keys.run = 0;
            player.keys.rightDown = false;
            FSM.ModAttacher.fireEvent("onKeyUpRight");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpUp = function (FSM, event) {
            var player = FSM.player;
            if (!FSM.MapScreener.underwater) {
                player.keys.jump = player.keys.up = false;
            }
            player.canjump = true;
            FSM.ModAttacher.fireEvent("onKeyUpUp");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpDown = function (FSM, event) {
            var player = FSM.player;
            player.keys.crouch = false;
            if (!player.piping) {
                FSM.animations.animatePlayerRemoveCrouch(player);
            }
            FSM.ModAttacher.fireEvent("onKeyUpDown");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpSprint = function (FSM, event) {
            var player = FSM.player;
            player.keys.sprint = false;
            FSM.ModAttacher.fireEvent("onKeyUpSprint");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.keyUpPause = function (FSM, event) {
            FSM.ModAttacher.fireEvent("onKeyUpPause");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.mouseDownRight = function (FSM, event) {
            FSM.GamesRunner.togglePause();
            FSM.ModAttacher.fireEvent("onMouseDownRight");
            if (event && event.preventDefault !== undefined) {
                event.preventDefault();
            }
        };
        Inputs.prototype.deviceMotion = function (FSM, event) {
            var deviceMotionStatus = FSM.deviceMotionStatus, acceleration = event.accelerationIncludingGravity;
            FSM.ModAttacher.fireEvent("onDeviceMotion", event);
            if (deviceMotionStatus.y !== undefined) {
                deviceMotionStatus.dy = acceleration.y - deviceMotionStatus.y;
                if (deviceMotionStatus.dy > 0.21) {
                    FSM.inputs.keyDownUp(FSM);
                }
                else if (deviceMotionStatus.dy < -0.14) {
                    FSM.inputs.keyUpUp(FSM);
                }
            }
            deviceMotionStatus.x = acceleration.x;
            deviceMotionStatus.y = acceleration.y;
            if (deviceMotionStatus.x > 2.1) {
                if (!deviceMotionStatus.motionLeft) {
                    FSM.inputs.keyDownLeft(FSM);
                    deviceMotionStatus.motionLeft = true;
                }
            }
            else if (deviceMotionStatus.x < -2.1) {
                if (!deviceMotionStatus.motionRight) {
                    FSM.inputs.keyDownRight(FSM);
                    deviceMotionStatus.motionRight = true;
                }
            }
            else {
                if (deviceMotionStatus.motionLeft) {
                    FSM.inputs.keyUpLeft(FSM);
                    deviceMotionStatus.motionLeft = false;
                }
                if (deviceMotionStatus.motionRight) {
                    FSM.inputs.keyUpRight(FSM);
                    deviceMotionStatus.motionRight = false;
                }
            }
        };
        Inputs.prototype.canInputsTrigger = function (FSM) {
            return !FSM.MapScreener.nokeys;
        };
        return Inputs;
    })();
    FullScreenMario.Inputs = Inputs;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Macros = (function () {
        function Macros() {
        }
        Macros.prototype.macroFillPreThings = function (reference, prethings, area, map, FSM) {
            var defaults = FSM.ObjectMaker.getFullPropertiesOf(reference.thing), xnum = reference.xnum || 1, ynum = reference.ynum || 1, xwidth = reference.xwidth || defaults.width, yheight = reference.yheight || defaults.height, x = reference.x || 0, yref = reference.y || 0, outputs = [], output, o = 0, y, i, j;
            for (i = 0; i < xnum; ++i) {
                y = yref;
                for (j = 0; j < ynum; ++j) {
                    output = {
                        "x": x,
                        "y": y,
                        "macro": undefined
                    };
                    outputs.push(FSM.proliferate(output, reference, true));
                    o += 1;
                    y += yheight;
                }
                x += xwidth;
            }
            return outputs;
        };
        Macros.prototype.macroFillPrePattern = function (reference, prethings, area, map, FSM) {
            if (!FSM.settings.maps.patterns[reference.pattern]) {
                throw new Error("An unknown pattern is referenced: " + reference);
            }
            var pattern = FSM.settings.maps.patterns[reference.pattern], length = pattern.length, defaults = FSM.ObjectMaker.getFullProperties(), repeats = reference.repeat || 1, xpos = reference.x || 0, ypos = reference.y || 0, outputs = [], o = 0, skips = {}, prething, output, i, j;
            if (typeof reference.skips !== "undefined") {
                for (i = 0; i < reference.skips.length; i += 1) {
                    skips[reference.skips[i]] = true;
                }
            }
            for (i = 0; i < repeats; i += 1) {
                for (j = 0; j < length; j += 1) {
                    if (skips[j]) {
                        continue;
                    }
                    prething = pattern[j];
                    output = {
                        "thing": prething[0],
                        "x": xpos + prething[1],
                        "y": ypos + prething[2]
                    };
                    output.y += defaults[prething[0]].height;
                    if (prething[3]) {
                        output.width = prething[3];
                    }
                    outputs.push(output);
                    o += 1;
                }
                xpos += pattern.width;
            }
            return outputs;
        };
        Macros.prototype.macroFloor = function (reference, prethings, area, map, FSM) {
            var x = reference.x || 0, y = reference.y || 0, floor = FSM.proliferate({
                "thing": "Floor",
                "x": x,
                "y": y,
                "width": (reference.width || 8),
                "height": "Infinity"
            }, reference, true);
            floor.macro = undefined;
            return floor;
        };
        Macros.prototype.macroPipe = function (reference, prethings, area, map, scope) {
            var x = reference.x || 0, y = reference.y || 0, height = reference.height || 16, pipe = FullScreenMario.FullScreenMario.prototype.proliferate({
                "thing": "Pipe",
                "x": x,
                "y": y,
                "width": 16,
                "height": reference.height === Infinity
                    ? "Infinity"
                    : reference.height || 8
            }, reference, true), output = [pipe];
            pipe.macro = undefined;
            if (height === "Infinity" || height === Infinity) {
                pipe.height = scope.MapScreener.height;
            }
            else {
                pipe.y += height;
            }
            if (reference.piranha) {
                output.push({
                    "thing": "Piranha",
                    "x": x + 4,
                    "y": pipe.y + 12,
                    "onPipe": true
                });
            }
            return output;
        };
        Macros.prototype.macroPipeCorner = function (reference, prethings, area, map, scope) {
            var x = reference.x || 0, y = reference.y || 0, height = reference.height || 16, output = [
                {
                    "thing": "PipeHorizontal",
                    "x": x,
                    "y": y,
                    "transport": reference.transport || 0
                },
                {
                    "thing": "PipeVertical",
                    "x": x + 16,
                    "y": y + height - 16,
                    "height": height
                }
            ];
            if (reference.scrollEnabler) {
                output.push({
                    "thing": "ScrollEnabler",
                    "x": x + 16,
                    "y": y + height + 48,
                    "height": 64,
                    "width": 16
                });
            }
            if (reference.scrollBlocker) {
                output.push({
                    "thing": "ScrollBlocker",
                    "x": x + 32
                });
            }
            return output;
        };
        Macros.prototype.macroTree = function (reference, prethings, area, map, scope) {
            var x = reference.x || 0, y = reference.y || 0, width = reference.width || 24, output = [
                {
                    "thing": "TreeTop",
                    "x": x,
                    "y": y,
                    "width": width
                }
            ];
            if (width > 16) {
                output.push({
                    "thing": "TreeTrunk",
                    "x": x + 8,
                    "y": y - 8,
                    "width": width - 16,
                    "height": "Infinity",
                    "groupType": reference.solidTrunk ? "Solid" : "Scenery"
                });
            }
            return output;
        };
        Macros.prototype.macroShroom = function (reference, prethings, area, map, scope) {
            var x = reference.x || 0, y = reference.y || 0, width = reference.width || 24, output = [
                {
                    "thing": "ShroomTop",
                    "x": x,
                    "y": y,
                    "width": width
                }
            ];
            if (width > 16) {
                output.push({
                    "thing": "ShroomTrunk",
                    "x": x + (width - 8) / 2,
                    "y": y - 8,
                    "height": Infinity,
                    "groupType": reference.solidTrunk ? "Solid" : "Scenery"
                });
            }
            return output;
        };
        Macros.prototype.macroWater = function (reference, prethings, area, map, FSM) {
            return FSM.proliferate({
                "thing": "Water",
                "x": reference.x || 0,
                "y": (reference.y || 0) + 2,
                "height": "Infinity",
                "macro": undefined
            }, reference, true);
        };
        Macros.prototype.macroCeiling = function (reference) {
            return {
                "macro": "Fill",
                "thing": "Brick",
                "x": reference.x,
                "y": 88,
                "xnum": (reference.width / 8) | 0,
                "xwidth": 8
            };
        };
        Macros.prototype.macroBridge = function (reference) {
            var x = reference.x || 0, y = reference.y || 0, width = Math.max(reference.width || 0, 16), output = [];
            if (reference.begin) {
                width -= 8;
                output.push({
                    "thing": "Stone",
                    "x": x,
                    "y": y,
                    "height": "Infinity"
                });
                x += 8;
            }
            if (reference.end) {
                width -= 8;
                output.push({
                    "thing": "Stone",
                    "x": x + width,
                    "y": y,
                    "height": "Infinity"
                });
            }
            output.push({ "thing": "BridgeBase", "x": x, "y": y, "width": width });
            output.push({ "thing": "Railing", "x": x, "y": y + 4, "width": width });
            return output;
        };
        Macros.prototype.macroScale = function (reference, prethings, area, map, FSM) {
            var x = reference.x || 0, y = reference.y || 0, unitsize = FSM.unitsize, widthLeft = reference.widthLeft || 24, widthRight = reference.widthRight || 24, between = reference.between || 40, dropLeft = reference.dropLeft || 24, dropRight = reference.dropRight || 24, collectionName = "ScaleCollection--" + [
                x, y, widthLeft, widthRight, dropLeft, dropRight
            ].join(",");
            return [
                {
                    "thing": "String",
                    "x": x,
                    "y": y - 4,
                    "height": dropLeft - 4,
                    "collectionName": collectionName,
                    "collectionKey": "stringLeft"
                },
                {
                    "thing": "String",
                    "x": x + between,
                    "y": y - 4,
                    "height": dropRight - 4,
                    "collectionName": collectionName,
                    "collectionKey": "stringRight"
                }, {
                    "thing": "String",
                    "x": x + 4,
                    "y": y,
                    "width": between - 7,
                    "collectionName": collectionName,
                    "collectionKey": "stringMiddle"
                }, {
                    "thing": "StringCornerLeft",
                    "x": x,
                    "y": y
                }, {
                    "thing": "StringCornerRight",
                    "x": x + between - 4,
                    "y": y
                }, {
                    "thing": "Platform",
                    "x": x - (widthLeft / 2),
                    "y": y - dropLeft,
                    "width": widthLeft,
                    "inScale": true,
                    "tension": (dropLeft - 1.5) * unitsize,
                    "onThingAdd": FSM.spawns.spawnScalePlatform,
                    "collectionName": collectionName,
                    "collectionKey": "platformLeft"
                }, {
                    "thing": "Platform",
                    "x": x + between - (widthRight / 2),
                    "y": y - dropRight,
                    "width": widthRight,
                    "inScale": true,
                    "tension": (dropRight - 1.5) * unitsize,
                    "onThingAdd": FSM.spawns.spawnScalePlatform,
                    "collectionName": collectionName,
                    "collectionKey": "platformRight"
                }];
        };
        Macros.prototype.macroPlatformGenerator = function (reference, prethings, area, map, FSM) {
            var output = [], direction = reference.direction || 1, levels = direction > 0 ? [0, 48] : [8, 56], width = reference.width || 16, x = reference.x || 0, yvel = direction * FSM.unitsize * .42, i;
            for (i = 0; i < levels.length; i += 1) {
                output.push({
                    "thing": "Platform",
                    "x": x,
                    "y": levels[i],
                    "width": width,
                    "yvel": yvel,
                    "movement": FSM.movements.movePlatformSpawn
                });
            }
            output.push({
                "thing": "PlatformString",
                "x": x + (width / 2) - .5,
                "y": FSM.MapScreener.floor,
                "width": 1,
                "height": FSM.MapScreener.height / FSM.unitsize
            });
            return output;
        };
        Macros.prototype.macroWarpWorld = function (reference, prethings, area, map, FSM) {
            var output = [], x = reference.x || 0, y = reference.y || 0, textHeight = reference.hasOwnProperty("textHeight") ? reference.textHeight : 8, warps = reference.warps, collectionName = "WarpWorldCollection-" + warps.join("."), keys = [], i;
            output.push({
                "thing": "CustomText",
                "x": x + 8,
                "y": y + textHeight + 56,
                "texts": [{
                        "text": "WELCOME TO WARP WORLD!"
                    }],
                "textAttributes": {
                    "hidden": true
                },
                "collectionName": collectionName,
                "collectionKey": "Welcomer"
            });
            output.push({
                "thing": "DetectCollision",
                "x": x + 64,
                "y": y + 174,
                "width": 40,
                "height": 102,
                "activate": FSM.activateWarpWorld,
                "collectionName": collectionName,
                "collectionKey": "Detector"
            });
            for (i = 0; i < warps.length; i += 1) {
                keys.push(i);
                output.push({
                    "macro": "Pipe",
                    "x": x + 8 + i * 32,
                    "height": 24,
                    "transport": { "map": warps[i] + "-1" },
                    "collectionName": collectionName,
                    "collectionKey": i + "-Pipe"
                });
                output.push({
                    "thing": "Piranha",
                    "x": x + 12 + i * 32,
                    "y": y + 36,
                    "collectionName": collectionName,
                    "collectionKey": i + "-Piranha"
                });
                output.push({
                    "thing": "CustomText",
                    "x": x + 14 + i * 32,
                    "y": y + 32 + textHeight,
                    "texts": [{
                            "text": String(warps[i])
                        }],
                    "textAttributes": {
                        "hidden": true
                    },
                    "collectionName": collectionName,
                    "collectionKey": i + "-Text"
                });
            }
            if (warps.length === 1) {
                for (i = 2; i < output.length; i += 1) {
                    output[i].x += 32;
                }
            }
            return output;
        };
        Macros.prototype.macroCheepsStart = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": FSM.MapScreener.floor,
                "width": reference.width || 8,
                "height": FSM.MapScreener.height / FSM.unitsize,
                "activate": FSM.activateCheepsStart
            };
        };
        Macros.prototype.macroCheepsStop = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": FSM.MapScreener.floor,
                "width": reference.width || 8,
                "height": FSM.MapScreener.height / FSM.unitsize,
                "activate": FSM.activateCheepsStop
            };
        };
        Macros.prototype.macroBulletBillsStart = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": FSM.MapScreener.floor,
                "width": reference.width || 8,
                "height": FSM.MapScreener.height / FSM.unitsize,
                "activate": FSM.activateBulletBillsStart
            };
        };
        Macros.prototype.macroBulletBillsStop = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": FSM.MapScreener.floor,
                "width": reference.width || 8,
                "height": FSM.MapScreener.height / FSM.unitsize,
                "activate": FSM.activateBulletBillsStop
            };
        };
        Macros.prototype.macroLakituStop = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": FSM.MapScreener.floor,
                "width": reference.width || 8,
                "height": FSM.MapScreener.height / FSM.unitsize,
                "activate": FSM.activateLakituStop
            };
        };
        Macros.prototype.macroCastleSmall = function (reference, prethings, area, map, FSM) {
            var output = [], x = reference.x || 0, y = reference.y || 0, i, j;
            for (i = 0; i < 2; i += 1) {
                output.push({
                    "thing": "BrickHalf",
                    "x": x + i * 8,
                    "y": y + 4,
                    "position": "end"
                });
                for (j = 1; j < 3; j += 1) {
                    output.push({
                        "thing": "BrickPlain",
                        "x": x + i * 8,
                        "y": y + 4 + j * 8,
                        "position": "end"
                    });
                }
            }
            for (i = 0; i < 2; i += 1) {
                output.push({
                    "thing": "BrickHalf",
                    "x": x + 24 + i * 8,
                    "y": y + 4,
                    "position": "end"
                });
                for (j = 1; j < 3; j += 1) {
                    output.push({
                        "thing": "BrickPlain",
                        "x": x + 24 + i * 8,
                        "y": y + 4 + j * 8,
                        "position": "end"
                    });
                }
            }
            output.push({
                "thing": "CastleRailing",
                "x": x,
                "y": y + 24,
                "position": "end"
            });
            for (i = 0; i < 3; i += 1) {
                output.push({
                    "thing": "CastleRailingFilled",
                    "x": x + (i + 1) * 8,
                    "y": y + 24,
                    "position": "end"
                });
            }
            output.push({
                "thing": "CastleRailing",
                "x": x + 32,
                "y": y + 24,
                "position": "end"
            });
            for (i = 0; i < 3; i += 1) {
                output.push({
                    "thing": "CastleRailing",
                    "x": x + (i + 1) * 8,
                    "y": y + 40,
                    "position": "end"
                });
            }
            for (i = 0; i < 2; i += 1) {
                output.push({
                    "thing": "CastleTop",
                    "x": x + 8 + i * 12,
                    "y": y + 36,
                    "position": "end"
                });
            }
            output.push({
                "thing": "CastleDoor",
                "x": x + 16,
                "y": y + 20,
                "position": "end"
            });
            if (reference.transport) {
                output.push({
                    "thing": "DetectCollision",
                    "x": x + 24,
                    "y": y + 16,
                    "height": 16,
                    "activate": FSM.collisions.collideCastleDoor,
                    "transport": reference.transport,
                    "position": "end"
                });
            }
            return output;
        };
        Macros.prototype.macroCastleLarge = function (reference, prethings, area, map, FSM) {
            var output = [], x = reference.x || 0, y = reference.y || 0, i, j;
            output.push({
                "macro": "CastleSmall",
                "x": x + 16,
                "y": y + 48
            });
            for (i = 0; i < 2; i += 1) {
                output.push({
                    "thing": "CastleWall",
                    "x": x + i * 8,
                    "y": y + 48
                });
            }
            for (i = 0; i < 3; i += 1) {
                output.push({
                    "thing": "CastleDoor",
                    "x": x + 16 + i * 16,
                    "y": y + 20,
                    "position": "end"
                });
                for (j = 0; j < 2; j += 1) {
                    output.push({
                        "thing": "BrickPlain",
                        "x": x + 16 + i * 16,
                        "y": y + 28 + j * 8
                    });
                    output.push({
                        "thing": "BrickHalf",
                        "x": x + 16 + i * 16,
                        "y": y + 40 + j * 4
                    });
                }
            }
            for (i = 0; i < 2; i += 1) {
                for (j = 0; j < 3; j += 1) {
                    output.push({
                        "thing": "BrickPlain",
                        "x": x + 24 + i * 16,
                        "y": y + 8 + j * 8
                    });
                }
                output.push({
                    "thing": "CastleDoor",
                    "x": x + 24 + i * 16,
                    "y": y + 44
                });
            }
            for (i = 0; i < 5; i += 1) {
                output.push({
                    "thing": "CastleRailingFilled",
                    "x": x + 16 + i * 8,
                    "y": y + 48
                });
            }
            j = reference.hasOwnProperty("walls") ? reference.walls : 2;
            for (i = 0; i < j; i += 1) {
                output.push({
                    "thing": "CastleWall",
                    "x": x + 56 + i * 8,
                    "y": y + 48,
                    "position": "end"
                });
            }
            if (reference.transport) {
                output.push({
                    "thing": "DetectCollision",
                    "x": x + 24,
                    "y": y + 16,
                    "height": 16,
                    "activate": FSM.collisions.collideCastleDoor,
                    "transport": reference.transport,
                    "position": "end"
                });
            }
            return output;
        };
        Macros.prototype.macroStartInsideCastle = function (reference) {
            var x = reference.x || 0, y = reference.y || 0, width = (reference.width || 0) - 40, output = [
                {
                    "thing": "Stone",
                    "x": x,
                    "y": y + 48,
                    "width": 24,
                    "height": Infinity
                },
                {
                    "thing": "Stone",
                    "x": x + 24,
                    "y": y + 40,
                    "width": 8,
                    "height": Infinity
                },
                {
                    "thing": "Stone",
                    "x": x + 32,
                    "y": y + 32,
                    "width": 8,
                    "height": Infinity
                }];
            if (width > 0) {
                output.push({
                    "macro": "Floor",
                    "x": x + 40,
                    "y": y + 24,
                    "width": width
                });
            }
            return output;
        };
        Macros.prototype.macroEndOutsideCastle = function (reference, prethings, area, map, FSM) {
            var x = reference.x || 0, y = reference.y || 0, collectionName = "EndOutsideCastle-" + [
                reference.x, reference.y, reference.large
            ].join(","), output;
            output = [
                {
                    "thing": "DetectCollision", x: x, y: y + 108, height: 100,
                    "activate": FullScreenMario.Collisions.prototype.collideFlagpole,
                    "activateFail": FullScreenMario.FullScreenMario.prototype.killNormal,
                    "noActivateDeath": true,
                    "collectionName": collectionName,
                    "collectionKey": "DetectCollision"
                },
                {
                    "thing": "Flag", "x": x - 4.5, "y": y + 79.5,
                    "collectionName": collectionName,
                    "collectionKey": "Flag"
                },
                {
                    "thing": "FlagTop", "x": x + 1.5, "y": y + 84,
                    "collectionName": collectionName,
                    "collectionKey": "FlagTop"
                },
                {
                    "thing": "FlagPole", "x": x + 3, "y": y + 80,
                    "collectionName": collectionName,
                    "collectionKey": "FlagPole"
                },
                {
                    "thing": "Stone", "x": x, "y": y + 8,
                    "collectionName": collectionName,
                    "collectionKey": "FlagPole"
                }];
            if (reference.large) {
                output.push({
                    "macro": "CastleLarge",
                    "x": x + (reference.castleDistance || 24),
                    "y": y,
                    "transport": reference.transport,
                    "walls": reference.walls || 8
                });
            }
            else {
                output.push({
                    "macro": "CastleSmall",
                    "x": x + (reference.castleDistance || 32),
                    "y": y,
                    "transport": reference.transport
                });
            }
            return output;
        };
        Macros.prototype.macroEndInsideCastle = function (reference, prethings, area, map, FSM) {
            var x = reference.x || 0, y = reference.y || 0, npc = reference.npc || "Toad", output, texts, keys;
            if (npc === "Toad") {
                keys = ["1", "2"];
                texts = [
                    {
                        "thing": "CustomText",
                        "x": x + 164,
                        "y": y + 64,
                        "texts": [{
                                "text": "THANK YOU MARIO!"
                            }],
                        "textAttributes": {
                            "hidden": true
                        },
                        "collectionName": "endInsideCastleText",
                        "collectionKey": "1"
                    }, {
                        "thing": "CustomText",
                        "x": x + 152,
                        "y": y + 48,
                        "texts": [
                            {
                                "text": "BUT OUR PRINCESS IS IN"
                            }, {
                                "text": "ANOTHER CASTLE!"
                            }],
                        "textAttributes": {
                            "hidden": true
                        },
                        "collectionName": "endInsideCastleText",
                        "collectionKey": "2"
                    }];
            }
            else if (npc === "Peach") {
                keys = ["1", "2", "3"];
                texts = [
                    {
                        "thing": "CustomText",
                        "x": x + 164,
                        "y": y + 64,
                        "texts": [{
                                "text": "THANK YOU MARIO!"
                            }],
                        "textAttributes": {
                            "hidden": true
                        },
                        "collectionName": "endInsideCastleText",
                        "collectionKey": "1"
                    }, {
                        "thing": "CustomText",
                        "x": x + 152,
                        "y": y + 48,
                        "texts": [
                            {
                                "text": "YOUR QUEST IS OVER.",
                                "offset": 12
                            }, {
                                "text": "WE PRESENT YOU A NEW QUEST."
                            }],
                        "textAttributes": {
                            "hidden": true
                        },
                        "collectionName": "endInsideCastleText",
                        "collectionKey": "2"
                    }, {
                        "thing": "CustomText",
                        "x": x + 152,
                        "y": 32,
                        "texts": [
                            {
                                "text": "PRESS BUTTON B",
                                "offset": 8
                            }, {
                                "text": "TO SELECT A WORLD"
                            }],
                        "textAttributes": {
                            "hidden": true
                        },
                        "collectionName": "endInsideCastleText",
                        "collectionKey": "3"
                    }];
            }
            output = [
                { "thing": "Stone", "x": x, "y": y + 88, "width": 256 },
                { "macro": "Water", "x": x, "y": y, "width": 104 },
                { "thing": "CastleBridge", "x": x, "y": y + 24, "width": 104 },
                {
                    "thing": "Bowser", "x": x + 69, "y": y + 42,
                    "hard": reference.hard,
                    "spawnType": reference.spawnType || "Goomba",
                    "throwing": reference.throwing
                },
                { "thing": "CastleChain", "x": x + 96, "y": y + 32 },
                { "thing": "CastleAxe", "x": x + 104, "y": y + 40 },
                { "thing": "ScrollBlocker", "x": x + 112 },
                { "macro": "Floor", "x": x + 104, "y": y, "width": 152 },
                {
                    "thing": "Stone", "x": x + 104, "y": y + 32,
                    "width": 24, "height": 32
                },
                {
                    "thing": "Stone", "x": x + 112, "y": y + 80,
                    "width": 16, "height": 24
                },
                {
                    "thing": "DetectCollision", "x": x + 180,
                    "activate": FSM.collisions.collideCastleNPC,
                    "transport": reference.transport,
                    "collectionName": "endInsideCastleText",
                    "collectionKey": "npc",
                    "collectionKeys": keys
                },
                { "thing": npc, "x": x + 200, "y": 13 },
                { "thing": "ScrollBlocker", "x": x + 256 }
            ];
            if (reference.topScrollEnabler) {
                output.push({
                    "thing": "ScrollEnabler",
                    "x": x + 96, "y": y + 140,
                    "height": 52, "width": 16
                });
                output.push({
                    "thing": "ScrollEnabler",
                    "x": x + 240, "y": y + 140,
                    "height": 52, "width": 16
                });
            }
            output.push.apply(output, texts);
            return output;
        };
        Macros.prototype.macroSection = function (reference, prethings, area, map, FSM) {
            return {
                "thing": "DetectSpawn",
                "x": reference.x || 0,
                "y": reference.y || 0,
                "activate": FSM.activateSectionBefore,
                "section": reference.section || 0
            };
        };
        Macros.prototype.macroSectionPass = function (reference) {
            return {
                "thing": "DetectCollision",
                "x": reference.x || 0,
                "y": reference.y || 0,
                "width": reference.width || 8,
                "height": reference.height || 8,
                "activate": function (thing) {
                    thing.FSM.AudioPlayer.play("Coin");
                    thing.FSM.MapScreener.sectionPassed = true;
                }
            };
        };
        Macros.prototype.macroSectionFail = function (reference) {
            return [
                {
                    "thing": "DetectCollision",
                    "x": reference.x,
                    "y": reference.y,
                    "width": reference.width || 8,
                    "height": reference.height || 8,
                    "activate": function (thing) {
                        thing.FSM.AudioPlayer.play("Fail");
                        thing.FSM.MapScreener.sectionPassed = false;
                    }
                }
            ];
        };
        Macros.prototype.macroSectionDecider = function (reference) {
            return {
                "thing": "DetectSpawn",
                "x": reference.x || 0,
                "y": reference.y || 0,
                "activate": function (thing) {
                    if (thing.FSM.MapScreener.sectionPassed) {
                        thing.section = reference.pass || 0;
                    }
                    else {
                        thing.section = reference.fail || 0;
                    }
                    thing.FSM.activateSectionBefore(thing);
                }
            };
        };
        return Macros;
    })();
    FullScreenMario.Macros = Macros;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Maintenance = (function () {
        function Maintenance() {
        }
        Maintenance.prototype.maintainTime = function (FSM) {
            if (!FSM.MapScreener.notime) {
                FSM.ItemsHolder.decrease("time", 1);
                return false;
            }
            if (!FSM.ItemsHolder.getItem("time")) {
                return true;
            }
            return false;
        };
        Maintenance.prototype.maintainScenery = function (FSM) {
            var things = FSM.GroupHolder.getGroup("Scenery"), delx = FSM.QuadsKeeper.left, thing, i;
            for (i = 0; i < things.length; i += 1) {
                thing = things[i];
                if (thing.right < delx && thing.outerok !== 2) {
                    FSM.arrayDeleteThing(thing, things, i);
                    i -= 1;
                }
            }
        };
        Maintenance.prototype.maintainSolids = function (FSM, solids) {
            var delx = FSM.QuadsKeeper.left, solid, i;
            FSM.QuadsKeeper.determineAllQuadrants("Solid", solids);
            for (i = 0; i < solids.length; i += 1) {
                solid = solids[i];
                if (solid.alive && solid.right > delx) {
                    if (solid.movement) {
                        solid.movement(solid);
                    }
                }
                else if (!solid.alive || solid.outerok !== 2) {
                    FSM.arrayDeleteThing(solid, solids, i);
                    i -= 1;
                }
            }
        };
        Maintenance.prototype.maintainCharacters = function (FSM, characters) {
            var delx = FSM.QuadsKeeper.right, character, i;
            for (i = 0; i < characters.length; i += 1) {
                character = characters[i];
                if (character.resting) {
                    character.yvel = 0;
                }
                else {
                    if (!character.nofall) {
                        character.yvel += character.gravity || FSM.MapScreener.gravity;
                    }
                    character.yvel = Math.min(character.yvel, FSM.MapScreener.maxyvel);
                }
                character.under = character.undermid = undefined;
                FSM.updatePosition(character);
                FSM.QuadsKeeper.determineThingQuadrants(character);
                FSM.ThingHitter.checkHitsForThing(character);
                if (character.overlaps && character.overlaps.length) {
                    FSM.maintenance.maintainOverlaps(character);
                }
                if (character.resting) {
                    if (!FSM.physics.isCharacterOnResting(character, character.resting)) {
                        if (character.onRestingOff) {
                            character.onRestingOff(character, character.resting);
                        }
                        else {
                            character.resting = undefined;
                        }
                    }
                    else {
                        character.yvel = 0;
                        FSM.setBottom(character, character.resting.top);
                    }
                }
                if (character.alive) {
                    if (!character.player &&
                        (character.numquads === 0 || character.left > delx) &&
                        (!character.outerok || (character.outerok !== 2
                            && character.right < FSM.MapScreener.width - delx))) {
                        FSM.arrayDeleteThing(character, characters, i);
                        i -= 1;
                    }
                    else {
                        if (!character.nomove && character.movement) {
                            character.movement(character);
                        }
                    }
                }
                else {
                    FSM.arrayDeleteThing(character, characters, i);
                    i -= 1;
                }
            }
        };
        Maintenance.prototype.maintainOverlaps = function (character) {
            if (character.checkOverlaps) {
                if (!character.FSM.physics.setOverlapBoundaries(character)) {
                    return;
                }
            }
            character.FSM.slideToX(character, character.overlapGoal, character.FSM.unitsize);
            if (character.overlapGoRight) {
                if (character.left >= character.overlapCheck) {
                    character.FSM.setLeft(character, character.overlapCheck);
                }
                else {
                    return;
                }
            }
            else {
                if (character.right <= character.overlapCheck) {
                    character.FSM.setRight(character, character.overlapCheck);
                }
                else {
                    return;
                }
            }
            character.overlaps.length = 0;
            character.checkOverlaps = true;
        };
        Maintenance.prototype.maintainPlayer = function (FSM) {
            var player = FSM.player;
            if (!FSM.physics.isThingAlive(player)) {
                return;
            }
            if (player.yvel > 0) {
                if (!FSM.MapScreener.underwater) {
                    player.keys.jump = false;
                }
                if (!player.jumping && !player.crouching) {
                    if (FSM.MapScreener.underwater) {
                        if (!player.paddling) {
                            FSM.switchClass(player, "paddling", "paddling");
                            player.paddling = true;
                        }
                    }
                    else {
                        FSM.addClass(player, "jumping");
                        player.jumping = true;
                    }
                }
                if (!player.dieing && player.top > FSM.MapScreener.bottom) {
                    if (FSM.AreaSpawner.getArea().exit) {
                        FSM.setLocation(FSM.AreaSpawner.getArea().exit);
                    }
                    else {
                        FSM.deaths.killPlayer(player, 2);
                    }
                    return;
                }
            }
            if (player.xvel > 0) {
                if (player.right > FSM.MapScreener.middleX) {
                    if (player.right > FSM.MapScreener.right - FSM.MapScreener.left) {
                        player.xvel = Math.min(0, player.xvel);
                    }
                }
            }
            else if (player.left < 0) {
                player.xvel = Math.max(0, player.xvel);
            }
            if (player.under) {
                player.jumpcount = 0;
            }
            if (FSM.MapScreener.canscroll) {
                var scrolloffset = player.right - FSM.MapScreener.middleX;
                if (scrolloffset > 0) {
                    FSM.scrollWindow(Math.min(player.scrollspeed, scrolloffset));
                }
            }
        };
        return Maintenance;
    })();
    FullScreenMario.Maintenance = Maintenance;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Movements = (function () {
        function Movements() {
        }
        Movements.prototype.moveSimple = function (thing) {
            if (thing.direction !== (thing.moveleft ? 1 : 0)) {
                if (thing.moveleft) {
                    thing.xvel = -thing.speed;
                    if (!thing.noflip) {
                        thing.FSM.unflipHoriz(thing);
                    }
                }
                else {
                    thing.xvel = thing.speed;
                    if (!thing.noflip) {
                        thing.FSM.flipHoriz(thing);
                    }
                }
                thing.direction = thing.moveleft ? 1 : 0;
            }
        };
        Movements.prototype.moveSmart = function (thing) {
            thing.FSM.movements.moveSimple(thing);
            if (thing.yvel !== 0) {
                return;
            }
            if (!thing.resting || !thing.FSM.physics.isCharacterOnResting(thing, thing.resting)) {
                if (thing.moveleft) {
                    thing.FSM.shiftHoriz(thing, thing.FSM.unitsize, true);
                }
                else {
                    thing.FSM.shiftHoriz(thing, -thing.FSM.unitsize, true);
                }
                thing.moveleft = !thing.moveleft;
            }
        };
        Movements.prototype.moveJumping = function (thing) {
            thing.FSM.movements.moveSimple(thing);
            if (thing.resting) {
                thing.yvel = -Math.abs(thing.jumpheight);
                thing.resting = undefined;
            }
        };
        Movements.prototype.movePacing = function (thing) {
            thing.counter += .007;
            thing.xvel = Math.sin(Math.PI * thing.counter) / 2.1;
        };
        Movements.prototype.moveHammerBro = function (thing) {
            thing.FSM.movements.movePacing(thing);
            thing.FSM.lookTowardsPlayer(thing);
            thing.nocollidesolid = thing.yvel < 0 || thing.falling;
        };
        Movements.prototype.moveBowser = function (thing) {
            if (thing.flipHoriz) {
                if (thing.FSM.objectToLeft(thing, thing.FSM.player)) {
                    thing.FSM.movements.moveSimple(thing);
                }
                else {
                    thing.moveleft = thing.lookleft = true;
                    thing.FSM.unflipHoriz(thing);
                    thing.FSM.movements.movePacing(thing);
                }
            }
            else {
                if (thing.FSM.objectToLeft(thing, thing.FSM.player)) {
                    thing.moveleft = thing.lookleft = false;
                    thing.FSM.flipHoriz(thing);
                    thing.FSM.movements.moveSimple(thing);
                }
                else {
                    thing.FSM.movements.movePacing(thing);
                }
            }
        };
        Movements.prototype.moveBowserFire = function (thing) {
            if (Math.round(thing.bottom) === Math.round(thing.ylev)) {
                thing.movement = undefined;
                return;
            }
            thing.FSM.shiftVert(thing, Math.min(Math.max(0, thing.ylev - thing.bottom), thing.FSM.unitsize));
        };
        Movements.prototype.moveFloating = function (thing) {
            if (thing.top <= thing.end) {
                thing.yvel = Math.min(thing.yvel + thing.FSM.unitsize / 64, thing.maxvel);
            }
            else if (thing.bottom >= thing.begin) {
                thing.yvel = Math.max(thing.yvel - thing.FSM.unitsize / 64, -thing.maxvel);
            }
            thing.FSM.movements.movePlatform(thing);
        };
        Movements.prototype.moveSliding = function (thing) {
            if (thing.FSM.MapScreener.left + thing.left <= thing.begin) {
                thing.xvel = Math.min(thing.xvel + thing.FSM.unitsize / 64, thing.maxvel);
            }
            else if (thing.FSM.MapScreener.left + thing.right > thing.end) {
                thing.xvel = Math.max(thing.xvel - thing.FSM.unitsize / 64, -thing.maxvel);
            }
            thing.FSM.movements.movePlatform(thing);
        };
        Movements.prototype.setMovementEndpoints = function (thing) {
            if (thing.begin > thing.end) {
                var temp = thing.begin;
                thing.begin = thing.end;
                thing.end = temp;
            }
            thing.begin *= thing.FSM.unitsize;
            thing.end *= thing.FSM.unitsize;
        };
        Movements.prototype.movePlatform = function (thing) {
            thing.FSM.shiftHoriz(thing, thing.xvel);
            thing.FSM.shiftVert(thing, thing.yvel);
            if (thing === thing.FSM.player.resting && thing.FSM.player.alive) {
                thing.FSM.setBottom(thing.FSM.player, thing.top);
                thing.FSM.shiftHoriz(thing.FSM.player, thing.xvel);
                if (thing.FSM.player.right > thing.FSM.MapScreener.width) {
                    thing.FSM.setRight(thing.FSM.player, thing.FSM.MapScreener.width);
                }
                else if (thing.FSM.player.left < 0) {
                    thing.FSM.setLeft(thing.FSM.player, 0);
                }
            }
        };
        Movements.prototype.movePlatformSpawn = function (thing) {
            if (thing.bottom < 0) {
                thing.FSM.setTop(thing, thing.FSM.MapScreener.bottomPlatformMax);
            }
            else if (thing.top > thing.FSM.MapScreener.bottomPlatformMax) {
                thing.FSM.setBottom(thing, 0);
            }
            else {
                thing.FSM.movements.movePlatform(thing);
                return;
            }
            if (thing.FSM.player
                && thing.FSM.player.resting === thing) {
                thing.FSM.player.resting = undefined;
            }
        };
        Movements.prototype.moveFalling = function (thing) {
            if (thing.FSM.player.resting !== thing) {
                thing.yvel = 0;
                return;
            }
            thing.FSM.shiftVert(thing, thing.yvel += thing.FSM.unitsize / 8);
            thing.FSM.setBottom(thing.FSM.player, thing.top);
            if (thing.yvel >= (thing.fallThresholdStart || thing.FSM.unitsize * 2.8)) {
                thing.freefall = true;
                thing.movement = thing.FSM.movements.moveFreeFalling;
            }
        };
        Movements.prototype.moveFreeFalling = function (thing) {
            thing.yvel += thing.acceleration || thing.FSM.unitsize / 16;
            thing.FSM.shiftVert(thing, thing.yvel);
            if (thing.yvel >= (thing.fallThresholdEnd || thing.FSM.unitsize * 2.1)) {
                thing.movement = thing.FSM.movements.movePlatform;
            }
        };
        Movements.prototype.movePlatformScale = function (thing) {
            if (thing.FSM.player.resting === thing) {
                thing.yvel += thing.FSM.unitsize / 16;
            }
            else if (thing.yvel > 0) {
                if (!thing.partners) {
                    thing.yvel = 0;
                }
                else {
                    thing.yvel = Math.max(thing.yvel - thing.FSM.unitsize / 16, 0);
                }
            }
            else {
                return;
            }
            thing.tension += thing.yvel;
            thing.FSM.shiftVert(thing, thing.yvel);
            if (!thing.partners) {
                return;
            }
            thing.partners.partnerPlatform.tension -= thing.yvel;
            if (thing.partners.partnerPlatform.tension <= 0) {
                thing.FSM.scoring.scoreOn(1000, thing);
                thing.partners.partnerPlatform.yvel = thing.FSM.unitsize / 2;
                thing.collide = thing.partners.partnerPlatform.collide = (thing.FSM.collisions.collideCharacterSolid);
                thing.movement = thing.partners.partnerPlatform.movement = (thing.FSM.movements.moveFreeFalling);
            }
            thing.FSM.shiftVert(thing.partners.partnerPlatform, -thing.yvel);
            thing.FSM.setHeight(thing.partners.ownString, thing.partners.ownString.height + thing.yvel / thing.FSM.unitsize);
            thing.FSM.setHeight(thing.partners.partnerString, Math.max(thing.partners.partnerString.height - (thing.yvel / thing.FSM.unitsize), 0));
        };
        Movements.prototype.moveVine = function (thing) {
            thing.FSM.increaseHeight(thing, thing.speed);
            thing.FSM.updateSize(thing);
            if (thing.attachedSolid) {
                thing.FSM.setBottom(thing, thing.attachedSolid.top);
            }
            if (thing.attachedCharacter) {
                thing.FSM.shiftVert(thing.attachedCharacter, -thing.speed);
            }
        };
        Movements.prototype.moveSpringboardUp = function (thing) {
            var player = thing.FSM.player;
            thing.FSM.reduceHeight(thing, -thing.tension, true);
            thing.tension *= 2;
            if (thing.height > thing.heightNormal) {
                thing.FSM.reduceHeight(thing, (thing.height - thing.heightNormal) * thing.FSM.unitsize);
                if (thing === player.spring) {
                    player.yvel = thing.FSM.MathDecider.compute("springboardYvelUp", thing);
                    player.resting = player.spring = undefined;
                    player.movement = thing.FSM.movements.movePlayer;
                }
                thing.tension = 0;
                thing.movement = undefined;
            }
            else {
                thing.FSM.setBottom(player, thing.top);
            }
            if (thing === player.spring) {
                if (!thing.FSM.physics.isThingTouchingThing(player, thing)) {
                    player.spring = undefined;
                    player.movement = Movements.prototype.movePlayer;
                }
            }
        };
        Movements.prototype.moveShell = function (thing) {
            if (thing.xvel !== 0) {
                return;
            }
            thing.counting += 1;
            if (thing.counting === 350) {
                thing.peeking = 1;
                thing.height += thing.FSM.unitsize / 8;
                thing.FSM.addClass(thing, "peeking");
                thing.FSM.updateSize(thing);
            }
            else if (thing.counting === 455) {
                thing.peeking = 2;
            }
            else if (thing.counting === 490) {
                thing.spawnSettings = {
                    "smart": thing.smart
                };
                thing.FSM.deaths.killSpawn(thing);
            }
        };
        Movements.prototype.movePiranha = function (thing) {
            var bottom = thing.bottom, height = thing.height + thing.direction, atEnd = false;
            if (thing.resting && !thing.FSM.physics.isThingAlive(thing.resting)) {
                bottom = thing.constructor.prototype.height * thing.FSM.unitsize + thing.top;
                height = Infinity;
                thing.resting = undefined;
            }
            if (height <= 0) {
                height = thing.height = 0;
                atEnd = true;
            }
            else if (height >= thing.constructor.prototype.height) {
                height = thing.height = thing.constructor.prototype.height;
                atEnd = true;
            }
            thing.FSM.setHeight(thing, height);
            thing.FSM.setBottom(thing, bottom);
            thing.canvas.height = height * thing.FSM.unitsize;
            thing.FSM.PixelDrawer.setThingSprite(thing);
            if (atEnd) {
                thing.counter = 0;
                thing.movement = thing.FSM.movements.movePiranhaLatent;
            }
        };
        Movements.prototype.movePiranhaLatent = function (thing) {
            var playerX = thing.FSM.getMidX(thing.FSM.player);
            if (thing.counter >= thing.countermax
                && (thing.height > 0
                    || playerX < thing.left - thing.FSM.unitsize * 8
                    || playerX > thing.right + thing.FSM.unitsize * 8)) {
                thing.movement = undefined;
                thing.direction *= -1;
                thing.FSM.TimeHandler.addEvent(function () {
                    thing.movement = thing.FSM.movements.movePiranha;
                }, 7);
            }
            else {
                thing.counter += 1;
            }
        };
        Movements.prototype.moveBubble = function (thing) {
            if (thing.top < (thing.FSM.MapScreener.top + thing.FSM.unitsize * 16)) {
                thing.FSM.deaths.killNormal(thing);
            }
        };
        Movements.prototype.moveCheepCheep = function (thing) {
            if (thing.top < thing.FSM.unitsize * 16) {
                thing.FSM.setTop(thing, thing.FSM.unitsize * 16);
                thing.yvel *= -1;
            }
        };
        Movements.prototype.moveCheepCheepFlying = function (thing) {
            if (thing.top < thing.FSM.unitsize * 28) {
                thing.movement = undefined;
                thing.nofall = false;
            }
        };
        Movements.prototype.moveBlooper = function (thing) {
            if (!thing.FSM.physics.isThingAlive(thing.FSM.player)) {
                thing.xvel = thing.FSM.unitsize / -4;
                thing.yvel = 0;
                thing.movement = undefined;
                return;
            }
            switch (thing.counter) {
                case 56:
                    thing.squeeze = 1;
                    thing.counter += 1;
                    break;
                case 63:
                    thing.FSM.movements.moveBlooperSqueezing(thing);
                    break;
                default:
                    thing.counter += 1;
                    if (thing.top < thing.FSM.unitsize * 18) {
                        thing.FSM.movements.moveBlooperSqueezing(thing);
                    }
                    break;
            }
            if (thing.squeeze) {
                thing.yvel = Math.max(thing.yvel + .021, .7);
            }
            else {
                thing.yvel = Math.min(thing.yvel - .035, -.7);
            }
            if (thing.top > thing.FSM.unitsize * 16) {
                thing.FSM.shiftVert(thing, thing.yvel, true);
            }
            if (!thing.squeeze) {
                if (thing.FSM.player.left > thing.right + thing.FSM.unitsize * 8) {
                    thing.xvel = Math.min(thing.speed, thing.xvel + thing.FSM.unitsize / 32);
                }
                else if (thing.FSM.player.right < thing.left - thing.FSM.unitsize * 8) {
                    thing.xvel = Math.max(-thing.speed, thing.xvel - thing.FSM.unitsize / 32);
                }
            }
        };
        Movements.prototype.moveBlooperSqueezing = function (thing) {
            if (thing.squeeze !== 2) {
                thing.squeeze = 2;
                thing.FSM.addClass(thing, "squeeze");
                thing.FSM.setHeight(thing, 10, true, true);
            }
            if (thing.squeeze < 7) {
                thing.xvel /= 1.4;
            }
            else if (thing.squeeze === 7) {
                thing.xvel = 0;
            }
            thing.squeeze += 1;
            if (thing.top > thing.FSM.player.bottom || thing.bottom > thing.FSM.unitsize * 91) {
                thing.FSM.animations.animateBlooperUnsqueezing(thing);
            }
        };
        Movements.prototype.movePodobooFalling = function (thing) {
            if (thing.top >= thing.starty) {
                thing.yvel = 0;
                thing.movement = undefined;
                thing.FSM.unflipVert(thing);
                thing.FSM.setTop(thing, thing.starty);
                return;
            }
            if (thing.yvel >= thing.speed) {
                thing.yvel = thing.speed;
                return;
            }
            if (!thing.flipVert && thing.yvel > 0) {
                thing.FSM.flipVert(thing);
            }
            thing.yvel += thing.gravity;
        };
        Movements.prototype.moveLakitu = function (thing) {
            var player = thing.FSM.player;
            if (player.xvel > thing.FSM.unitsize / 8
                && player.left > thing.FSM.MapScreener.width / 2) {
                if (thing.left < player.right + thing.FSM.unitsize * 16) {
                    thing.FSM.slideToX(thing, player.right + player.xvel + thing.FSM.unitsize * 32, player.maxspeed * 1.4);
                    thing.counter = 0;
                }
            }
            else {
                thing.counter += .007;
                thing.FSM.slideToX(thing, player.left + player.xvel + Math.sin(Math.PI * thing.counter) * 117, player.maxspeed * .7);
            }
        };
        Movements.prototype.moveLakituInitial = function (thing) {
            if (thing.right < thing.FSM.player.left) {
                thing.counter = 0;
                thing.movement = thing.FSM.movements.moveLakitu;
                thing.movement(thing);
                return;
            }
            thing.FSM.shiftHoriz(thing, -thing.FSM.unitsize);
        };
        Movements.prototype.moveLakituFleeing = function (thing) {
            thing.FSM.shiftHoriz(thing, -thing.FSM.unitsize);
        };
        Movements.prototype.moveCoinEmerge = function (thing, parent) {
            thing.FSM.shiftVert(thing, thing.yvel);
            if (parent && thing.bottom >= thing.blockparent.bottom) {
                thing.FSM.deaths.killNormal(thing);
            }
        };
        Movements.prototype.movePlayer = function (thing) {
            if (!thing.keys.up) {
                thing.keys.jump = false;
            }
            else if (thing.keys.jump
                && (thing.yvel <= 0 || thing.FSM.MapScreener.underwater)) {
                if (thing.FSM.MapScreener.underwater) {
                    thing.FSM.animations.animatePlayerPaddling(thing);
                    thing.FSM.removeClass(thing, "running");
                }
                if (thing.resting) {
                    if (thing.resting.xvel) {
                        thing.xvel += thing.resting.xvel;
                    }
                    thing.resting = undefined;
                }
                else {
                    if (!thing.jumping && !thing.FSM.MapScreener.underwater) {
                        thing.FSM.switchClass(thing, "running skidding", "jumping");
                    }
                    thing.jumping = true;
                    if (thing.power > 1 && thing.crouching) {
                        thing.FSM.removeClass(thing, "jumping");
                    }
                }
                if (!thing.FSM.MapScreener.underwater) {
                    thing.keys.jumplev += 1;
                    thing.FSM.MathDecider.compute("decreasePlayerJumpingYvel", thing);
                }
            }
            if (thing.keys.crouch && !thing.crouching && thing.resting) {
                if (thing.power > 1) {
                    thing.crouching = true;
                    thing.FSM.removeClass(thing, "running");
                    thing.FSM.addClass(thing, "crouching");
                    thing.FSM.setHeight(thing, 11, true, true);
                    thing.height = 11;
                    thing.tolyOld = thing.toly;
                    thing.toly = thing.FSM.unitsize * 4;
                    thing.FSM.updateBottom(thing, 0);
                    thing.FSM.updateSize(thing);
                }
                if (thing.resting.actionTop) {
                    thing.FSM.ModAttacher.fireEvent("onPlayerActionTop", thing, thing.resting);
                    thing.resting.actionTop(thing, thing.resting);
                }
            }
            if (thing.FSM.MathDecider.compute("decreasePlayerRunningXvel", thing)) {
                if (thing.skidding) {
                    thing.FSM.addClass(thing, "skidding");
                }
                else {
                    thing.FSM.removeClass(thing, "skidding");
                }
            }
            if (Math.abs(thing.xvel) < .14) {
                if (thing.running) {
                    thing.running = false;
                    if (thing.power === 1) {
                        thing.FSM.setPlayerSizeSmall(thing);
                    }
                    thing.FSM.removeClasses(thing, "running skidding one two three");
                    thing.FSM.addClass(thing, "still");
                    thing.FSM.TimeHandler.cancelClassCycle(thing, "running");
                }
            }
            else if (!thing.running) {
                thing.running = true;
                thing.FSM.animations.animatePlayerRunningCycle(thing);
                if (thing.power === 1) {
                    thing.FSM.setPlayerSizeSmall(thing);
                }
            }
            if (thing.xvel > 0) {
                thing.xvel = Math.min(thing.xvel, thing.maxspeed);
                if (thing.moveleft && (thing.resting || thing.FSM.MapScreener.underwater)) {
                    thing.FSM.unflipHoriz(thing);
                    thing.moveleft = false;
                }
            }
            else if (thing.xvel < 0) {
                thing.xvel = Math.max(thing.xvel, thing.maxspeed * -1);
                if (!thing.moveleft && (thing.resting || thing.FSM.MapScreener.underwater)) {
                    thing.moveleft = true;
                    thing.FSM.flipHoriz(thing);
                }
            }
            if (thing.resting) {
                if (thing.hopping) {
                    thing.hopping = false;
                    thing.FSM.removeClass(thing, "hopping");
                    if (thing.xvel) {
                        thing.FSM.addClass(thing, "running");
                    }
                }
                thing.keys.jumplev = thing.yvel = thing.jumpcount = 0;
                if (thing.jumping) {
                    thing.jumping = false;
                    thing.FSM.removeClass(thing, "jumping");
                    if (thing.power === 1) {
                        thing.FSM.setPlayerSizeSmall(thing);
                    }
                    thing.FSM.addClass(thing, Math.abs(thing.xvel) < .14 ? "still" : "running");
                }
                if (thing.paddling) {
                    thing.paddling = thing.swimming = false;
                    thing.FSM.TimeHandler.cancelClassCycle(thing, "paddling");
                    thing.FSM.removeClasses(thing, "paddling swim1 swim2");
                    thing.FSM.addClass(thing, "running");
                }
            }
        };
        Movements.prototype.movePlayerVine = function (thing) {
            var attachedSolid = thing.attachedSolid, animatedClimbing;
            if (!attachedSolid) {
                thing.movement = thing.FSM.movements.movePlayer;
                return;
            }
            if (thing.bottom < thing.attachedSolid.top) {
                thing.FSM.unattachPlayer(thing, thing.attachedSolid);
                return;
            }
            if (thing.keys.run !== 0 && thing.keys.run === thing.attachedDirection) {
                if (thing.attachedDirection === -1) {
                    thing.FSM.setRight(thing, attachedSolid.left - thing.FSM.unitsize);
                }
                else if (thing.attachedDirection === 1) {
                    thing.FSM.setLeft(thing, attachedSolid.right + thing.FSM.unitsize);
                }
                thing.FSM.unattachPlayer(thing, attachedSolid);
                return;
            }
            if (thing.keys.up) {
                animatedClimbing = true;
                thing.FSM.shiftVert(thing, thing.FSM.unitsize / -4);
            }
            else if (thing.keys.crouch) {
                animatedClimbing = true;
                thing.FSM.shiftVert(thing, thing.FSM.unitsize / 2);
                if (thing.top > attachedSolid.bottom) {
                    thing.FSM.unattachPlayer(thing, thing.attachedSolid);
                }
                return;
            }
            else {
                animatedClimbing = false;
            }
            if (animatedClimbing && !thing.animatedClimbing) {
                thing.FSM.addClass(thing, "animated");
            }
            else if (!animatedClimbing && thing.animatedClimbing) {
                thing.FSM.removeClass(thing, "animated");
            }
            thing.animatedClimbing = animatedClimbing;
            if (thing.bottom < thing.FSM.MapScreener.top - thing.FSM.unitsize * 4) {
                thing.FSM.setLocation(thing.attachedSolid.transport);
            }
        };
        Movements.prototype.movePlayerSpringboardDown = function (thing) {
            var other = thing.spring;
            if (!thing.FSM.physics.isThingTouchingThing(thing, other)) {
                thing.movement = thing.FSM.movements.movePlayer;
                other.movement = thing.FSM.movements.moveSpringboardUp;
                thing.spring = undefined;
                return;
            }
            if (other.height < thing.FSM.unitsize * 2.5
                || other.tension < thing.FSM.unitsize / 32) {
                thing.movement = undefined;
                other.movement = thing.FSM.movements.moveSpringboardUp;
                return;
            }
            if (thing.left < other.left + thing.FSM.unitsize * 2
                || thing.right > other.right - thing.FSM.unitsize * 2) {
                thing.xvel /= 1.4;
            }
            thing.FSM.reduceHeight(other, other.tension, true);
            other.tension /= 2;
            thing.FSM.setBottom(thing, other.top);
            thing.FSM.updateSize(other);
        };
        return Movements;
    })();
    FullScreenMario.Movements = Movements;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Physics = (function () {
        function Physics() {
        }
        Physics.prototype.generateCanThingCollide = function () {
            return function canThingCollide(thing) {
                return thing.alive && !thing.nocollide;
            };
        };
        Physics.prototype.isThingAlive = function (thing) {
            return thing && thing.alive && !thing.dead;
        };
        Physics.prototype.isThingTouchingThing = function (thing, other) {
            return (!thing.nocollide && !other.nocollide
                && thing.right - thing.FSM.unitsize > other.left
                && thing.left + thing.FSM.unitsize < other.right
                && thing.bottom >= other.top
                && thing.top <= other.bottom);
        };
        Physics.prototype.isThingOnThing = function (thing, other) {
            if (thing.groupType === "Solid" && other.yvel > 0) {
                return false;
            }
            if (thing.yvel < other.yvel && other.groupType !== "Solid") {
                return false;
            }
            if (thing.player && thing.bottom < other.bottom && other.enemy) {
                return true;
            }
            if (thing.left + thing.FSM.unitsize >= other.right) {
                return false;
            }
            if (thing.right - thing.FSM.unitsize <= other.left) {
                return false;
            }
            if (thing.bottom <= other.top + other.toly + other.yvel) {
                return true;
            }
            if (thing.bottom <= other.top + other.toly + Math.abs(thing.yvel - other.yvel)) {
                return true;
            }
            return false;
        };
        Physics.prototype.isThingOnSolid = function (thing, other) {
            if (thing.left + thing.FSM.unitsize >= other.right) {
                return false;
            }
            if (thing.right - thing.FSM.unitsize <= other.left) {
                return false;
            }
            if (thing.bottom - thing.yvel <= other.top + other.toly + thing.yvel) {
                return true;
            }
            if (thing.bottom <= other.top + other.toly + Math.abs(thing.yvel - other.yvel)) {
                return true;
            }
            return false;
        };
        Physics.prototype.isCharacterOnSolid = function (thing, other) {
            if (thing.resting === other) {
                return true;
            }
            if (thing.yvel < 0) {
                return false;
            }
            if (!thing.FSM.physics.isThingOnSolid(thing, other)) {
                return false;
            }
            if (thing.left + thing.xvel + thing.FSM.unitsize === other.right) {
                return false;
            }
            if (thing.right - thing.xvel - thing.FSM.unitsize === other.left) {
                return false;
            }
            return true;
        };
        Physics.prototype.isCharacterOnResting = function (thing, other) {
            if (!thing.FSM.physics.isThingOnSolid(thing, other)) {
                return false;
            }
            if (thing.left + thing.xvel + thing.FSM.unitsize === other.right) {
                return false;
            }
            if (thing.right - thing.xvel - thing.FSM.unitsize === other.left) {
                return false;
            }
            return true;
        };
        Physics.prototype.generateIsCharacterTouchingCharacter = function () {
            return function isCharacterTouchingCharacter(thing, other) {
                if (thing.nocollidechar && (!other.player || thing.nocollideplayer)) {
                    return false;
                }
                if (other.nocollidechar && (!thing.player || other.nocollideplayer)) {
                    return false;
                }
                return thing.FSM.physics.isThingTouchingThing(thing, other);
            };
        };
        Physics.prototype.generateIsCharacterTouchingSolid = function () {
            return function isCharacterTouchingSolid(thing, other) {
                if (other.hidden && !other.collideHidden) {
                    if (!thing.player || !thing.FSM.physics.isSolidOnCharacter(other, thing)) {
                        return false;
                    }
                }
                if (thing.nocollidesolid && !(thing.allowUpSolids && other.up)) {
                    return false;
                }
                return thing.FSM.physics.isThingTouchingThing(thing, other);
            };
        };
        Physics.prototype.isCharacterAboveEnemy = function (thing, other) {
            return thing.bottom < other.top + other.toly;
        };
        Physics.prototype.isCharacterBumpingSolid = function (thing, other) {
            return thing.top + thing.toly + Math.abs(thing.yvel) > other.bottom;
        };
        Physics.prototype.isCharacterOverlappingSolid = function (thing, other) {
            return thing.top <= other.top && thing.bottom > other.bottom;
        };
        Physics.prototype.isSolidOnCharacter = function (thing, other) {
            if (other.yvel >= 0) {
                return false;
            }
            var midx = thing.FSM.getMidX(other);
            if (midx <= thing.left || midx >= thing.right) {
                return false;
            }
            if (thing.bottom - thing.yvel > other.top + other.toly - other.yvel) {
                return false;
            }
            return true;
        };
        Physics.prototype.generateHitCharacterSolid = function () {
            return function hitCharacterSolid(thing, other) {
                if (other.up && thing !== other.up) {
                    return thing.FSM.collisions.collideCharacterSolidUp(thing, other);
                }
                other.collide(thing, other);
                if (thing.undermid) {
                    if (thing.undermid.bottomBump) {
                        thing.undermid.bottomBump(thing.undermid, thing);
                    }
                }
                else if (thing.under && thing.under && thing.under.bottomBump) {
                    thing.under.bottomBump(thing.under[0], thing);
                }
                if (thing.checkOverlaps
                    && thing.FSM.physics.isCharacterOverlappingSolid(thing, other)) {
                    thing.FSM.markOverlap(thing, other);
                }
            };
        };
        Physics.prototype.generateHitCharacterCharacter = function () {
            return function hitCharacterCharacter(thing, other) {
                if (thing.player) {
                    if (other.collide) {
                        return other.collide(thing, other);
                    }
                }
                else if (thing.collide) {
                    thing.collide(other, thing);
                }
            };
        };
        Physics.prototype.setOverlapBoundaries = function (thing) {
            if (thing.overlaps.length === 1) {
                thing.overlaps.length = 0;
                return false;
            }
            var rightX = -Infinity, leftX = Infinity, overlaps = thing.overlaps, other, leftThing, rightThing, midpoint, i;
            for (i = 0; i < overlaps.length; i += 1) {
                other = overlaps[i];
                if (other.right > rightX) {
                    rightThing = other;
                }
                if (other.left < leftX) {
                    leftThing = other;
                }
            }
            midpoint = (leftX + rightX) / 2;
            if (thing.FSM.getMidX(thing) >= midpoint) {
                thing.overlapGoal = Infinity;
                thing.overlapGoRight = true;
                thing.overlapCheck = rightThing.right;
            }
            else {
                thing.overlapGoal = -Infinity;
                thing.overlapGoRight = false;
                thing.overlapCheck = leftThing.left;
            }
            thing.checkOverlaps = false;
            return true;
        };
        return Physics;
    })();
    FullScreenMario.Physics = Physics;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Scoring = (function () {
        function Scoring(FSM) {
            this.FSM = FSM;
        }
        Scoring.prototype.findScore = function (level) {
            if (level < this.FSM.pointLevels.length) {
                return this.FSM.pointLevels[level];
            }
            this.FSM.gainLife(1);
            return 0;
        };
        Scoring.prototype.score = function (value, continuation) {
            if (!value) {
                return;
            }
            this.scoreOn(value, this.FSM.player, true);
            if (!continuation) {
                this.FSM.ItemsHolder.increase("score", value);
            }
        };
        Scoring.prototype.scoreOn = function (value, thing, continuation) {
            if (!value) {
                return;
            }
            var text = this.FSM.addThing("Text" + value);
            this.FSM.scoring.scoreAnimateOn(text, thing);
            if (!continuation) {
                this.FSM.ItemsHolder.increase("score", value);
            }
            this.FSM.ModAttacher.fireEvent("onScoreOn", value, thing, continuation);
        };
        Scoring.prototype.scoreAnimateOn = function (text, thing) {
            this.FSM.setMidXObj(text, thing);
            this.FSM.setBottom(text, thing.top);
            this.FSM.scoring.scoreAnimate(text);
        };
        Scoring.prototype.scoreAnimate = function (thing, timeout) {
            if (timeout === void 0) { timeout = 28; }
            this.FSM.TimeHandler.addEventInterval(this.FSM.shiftVert, 1, timeout, thing, -this.FSM.unitsize / 6);
            this.FSM.TimeHandler.addEvent(this.FSM.killNormal, timeout, thing);
        };
        Scoring.prototype.scorePlayerShell = function (thing, other) {
            if (thing.star) {
                this.FSM.scoring.scoreOn(200, other);
                return;
            }
            if (!other.resting) {
                this.FSM.scoring.scoreOn(8000, other);
                return;
            }
            if (other.peeking) {
                this.FSM.scoring.scoreOn(1000, other);
                return;
            }
            if (thing.jumpcount) {
                this.FSM.scoring.scoreOn(500, other);
                return;
            }
            this.FSM.scoring.scoreOn(400, other);
        };
        Scoring.prototype.scorePlayerFlag = function (thing, difference) {
            var amount;
            if (difference < 28) {
                amount = difference < 8 ? 100 : 400;
            }
            else if (difference < 40) {
                amount = 800;
            }
            else {
                amount = difference < 62 ? 2000 : 5000;
            }
            return amount;
        };
        return Scoring;
    })();
    FullScreenMario.Scoring = Scoring;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Spawns = (function () {
        function Spawns() {
        }
        Spawns.prototype.spawnDeadGoomba = function (thing) {
            thing.FSM.TimeHandler.addEvent(function () { return thing.FSM.deaths.killNormal(thing); }, 21);
        };
        Spawns.prototype.spawnHammerBro = function (thing) {
            thing.counter = 0;
            thing.gravity = thing.FSM.MapScreener.gravity / 2.1;
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateThrowingHammer, 35, thing, 7);
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateJump, 140, Infinity, thing);
        };
        Spawns.prototype.spawnBowser = function (thing) {
            var i;
            thing.counter = 0;
            thing.deathcount = 0;
            for (i = 0; i < thing.fireTimes.length; i += 1) {
                thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateBowserFire, thing.fireTimes[i], Infinity, thing);
            }
            for (i = 0; i < thing.jumpTimes.length; i += 1) {
                thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateBowserJump, thing.jumpTimes[i], Infinity, thing);
            }
            if (thing.throwing) {
                for (i = 0; i < thing.throwAmount; i += 1) {
                    thing.FSM.TimeHandler.addEvent(function () {
                        thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateBowserThrow, thing.throwPeriod, Infinity, thing);
                    }, thing.throwDelay + i * thing.throwBetween);
                }
            }
        };
        Spawns.prototype.spawnPiranha = function (thing) {
            var bottom;
            thing.counter = 0;
            thing.direction = thing.FSM.unitsize / -40;
            if (thing.onPipe) {
                bottom = thing.bottom;
                thing.FSM.setHeight(thing, 6);
                thing.FSM.setBottom(thing, bottom);
            }
        };
        Spawns.prototype.spawnBlooper = function (thing) {
            thing.squeeze = 0;
            thing.counter = 0;
        };
        Spawns.prototype.spawnPodoboo = function (thing) {
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animatePodobooJumpUp, thing.frequency, Infinity, thing);
        };
        Spawns.prototype.spawnLakitu = function (thing) {
            thing.FSM.MapScreener.lakitu = thing;
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateLakituThrowingSpiny, 140, Infinity, thing);
        };
        Spawns.prototype.spawnCannon = function (thing) {
            if (thing.noBullets) {
                return;
            }
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateCannonFiring, thing.frequency, thing.frequency, thing);
        };
        Spawns.prototype.spawnCastleBlock = function (thing) {
            if (!thing.fireballs) {
                return;
            }
            var balls = [], i;
            for (i = 0; i < thing.fireballs; i += 1) {
                balls.push(thing.FSM.addThing("CastleFireball"));
                thing.FSM.setMidObj(balls[i], thing);
            }
            if (thing.speed >= 0) {
                thing.dt = 0.07;
                thing.angle = 0.25;
            }
            else {
                thing.dt = -0.07;
                thing.angle = -0.25;
            }
            if (!thing.direction) {
                thing.direction = -1;
            }
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.animations.animateCastleBlock, Math.round(7 / Math.abs(thing.speed)), Infinity, thing, balls);
        };
        Spawns.prototype.spawnMoveFloating = function (thing) {
            thing.FSM.movements.setMovementEndpoints(thing);
            thing.begin = thing.FSM.MapScreener.floor * thing.FSM.unitsize - thing.begin;
            thing.end = thing.FSM.MapScreener.floor * thing.FSM.unitsize - thing.end;
        };
        Spawns.prototype.spawnMoveSliding = function (thing) {
            thing.FSM.movements.setMovementEndpoints(thing);
        };
        Spawns.prototype.spawnScalePlatform = function (thing) {
            var collection = thing.collection || {}, ownKey = thing.collectionKey === "platformLeft" ? "Left" : "Right", partnerKey = ownKey === "Left" ? "Right" : "Left";
            thing.partners = {
                "ownString": collection["string" + ownKey],
                "partnerString": collection["string" + partnerKey],
                "partnerPlatform": collection["platform" + partnerKey]
            };
        };
        Spawns.prototype.spawnRandomCheep = function (FSM) {
            if (!FSM.MapScreener.spawningCheeps) {
                return true;
            }
            var spawn = FSM.ObjectMaker.make("CheepCheep", {
                "flying": true,
                "xvel": FSM.NumberMaker.random() * FSM.unitsize * 1.4,
                "yvel": FSM.unitsize * -1.4
            });
            FSM.addThing(spawn, FSM.NumberMaker.random() * FSM.MapScreener.width, FSM.MapScreener.height);
            if (spawn.left < FSM.MapScreener.width / 2) {
                FSM.flipHoriz(spawn);
            }
            else {
                spawn.xvel *= -1;
            }
            return false;
        };
        Spawns.prototype.spawnRandomBulletBill = function (FSM) {
            if (!FSM.MapScreener.spawningBulletBills) {
                return true;
            }
            var spawn = FSM.ObjectMaker.make("BulletBill");
            spawn.direction = 1;
            spawn.moveleft = true;
            spawn.xvel *= -1;
            FSM.flipHoriz(spawn);
            FSM.addThing(spawn, FSM.MapScreener.width, Math.floor(FSM.NumberMaker.randomIntWithin(0, FSM.MapScreener.floor) / 8) * 8 * FSM.unitsize);
            return false;
        };
        Spawns.prototype.spawnCustomText = function (thing) {
            var top = thing.top, texts = thing.texts, attributes = thing.textAttributes, spacingHorizontal = thing.spacingHorizontal * thing.FSM.unitsize, spacingVertical = thing.spacingVertical * thing.FSM.unitsize, spacingVerticalBlank = thing.spacingVerticalBlank * thing.FSM.unitsize, children = [], textChild, left, text, letter, i, j;
            thing.children = children;
            for (i = 0; i < texts.length; i += 1) {
                if (!texts[i]) {
                    top += spacingVerticalBlank;
                    continue;
                }
                text = texts[i].text;
                if (texts[i].offset) {
                    left = thing.left + texts[i].offset * thing.FSM.unitsize;
                }
                else {
                    left = thing.left;
                }
                for (j = 0; j < text.length; j += 1) {
                    letter = text[j];
                    if (thing.FSM.customTextMappings.hasOwnProperty(letter)) {
                        letter = thing.FSM.customTextMappings[letter];
                    }
                    letter = "Text" + thing.size + letter;
                    textChild = thing.FSM.ObjectMaker.make(letter, attributes);
                    textChild.FSM.addThing(textChild, left, top);
                    children.push(textChild);
                    left += textChild.width * thing.FSM.unitsize;
                    left += spacingHorizontal;
                }
                top += spacingVertical;
            }
            thing.FSM.killNormal(thing);
        };
        Spawns.prototype.spawnDetector = function (thing) {
            thing.activate(thing);
            thing.FSM.killNormal(thing);
        };
        Spawns.prototype.spawnScrollBlocker = function (thing) {
            if (thing.FSM.MapScreener.width < thing.right) {
                thing.setEdge = true;
            }
        };
        Spawns.prototype.spawnCollectionComponent = function (collection, thing) {
            thing.collection = collection;
            collection[thing.collectionName] = thing;
        };
        Spawns.prototype.spawnRandomSpawner = function (thing) {
            var FSM = thing.FSM, left = (thing.left + FSM.MapScreener.left) / FSM.unitsize;
            FSM.WorldSeeder.clearGeneratedCommands();
            FSM.WorldSeeder.generateFull({
                "title": thing.randomization,
                "top": thing.randomTop,
                "right": left + thing.randomWidth,
                "bottom": thing.randomBottom,
                "left": left,
                "width": thing.randomWidth,
                "height": thing.randomTop - thing.randomBottom
            });
            FSM.WorldSeeder.runGeneratedCommands();
            FSM.AreaSpawner.spawnArea("xInc", FSM.QuadsKeeper.top / FSM.unitsize, FSM.QuadsKeeper.right / FSM.unitsize, FSM.QuadsKeeper.bottom / FSM.unitsize, FSM.QuadsKeeper.left / FSM.unitsize);
        };
        return Spawns;
    })();
    FullScreenMario.Spawns = Spawns;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Transports = (function () {
        function Transports() {
        }
        Transports.prototype.mapEntranceNormal = function (FSM, location) {
            if (location && location.xloc) {
                FSM.scrollWindow(location.xloc * FSM.unitsize);
            }
            FSM.addPlayer(FSM.unitsize * 16, FSM.unitsize * 16);
        };
        Transports.prototype.mapEntrancePlain = function (FSM, location) {
            if (location && location.xloc) {
                FSM.scrollWindow(location.xloc * FSM.unitsize);
            }
            FSM.addPlayer(FSM.unitsize * 16, FSM.MapScreener.floor * FSM.unitsize);
        };
        Transports.prototype.mapEntranceWalking = function (FSM, location) {
            FSM.transports.mapEntrancePlain(FSM, location);
            FSM.player.keys.run = 1;
            FSM.player.maxspeed = FSM.player.walkspeed;
            FSM.MapScreener.nokeys = true;
            FSM.MapScreener.notime = true;
        };
        Transports.prototype.mapEntranceCastle = function (FSM) {
            FSM.addPlayer(FSM.unitsize * 2, FSM.unitsize * 56);
        };
        Transports.prototype.mapEntranceVine = function (FSM) {
            var threshold = FSM.MapScreener.bottom - FSM.unitsize * 40, vine = FSM.addThing("Vine", FSM.unitsize * 32, FSM.MapScreener.bottom + FSM.unitsize * 8);
            FSM.TimeHandler.addEventInterval(function () {
                if (vine.top >= threshold) {
                    return false;
                }
                vine.movement = undefined;
                FSM.transports.mapEntranceVinePlayer(FSM, vine);
                return true;
            }, 1, Infinity);
        };
        Transports.prototype.mapEntranceVinePlayer = function (FSM, vine) {
            var threshold = FSM.MapScreener.bottom - FSM.unitsize * 24, speed = FSM.unitsize / -4, player = FSM.addPlayer(FSM.unitsize * 29, FSM.MapScreener.bottom - FSM.unitsize * 4);
            FSM.shiftVert(player, player.height * FSM.unitsize);
            FSM.collisions.collideVine(player, vine);
            FSM.TimeHandler.addEventInterval(function () {
                FSM.shiftVert(player, speed);
                if (player.top < threshold) {
                    FSM.TimeHandler.addEvent(FSM.animations.animatePlayerOffVine, 49, player);
                    return true;
                }
                return false;
            }, 1, Infinity);
        };
        Transports.prototype.mapEntrancePipeVertical = function (FSM, location) {
            if (location && location.xloc) {
                FSM.scrollWindow(location.xloc * FSM.unitsize);
            }
            FSM.addPlayer(location.entrance.left + FSM.player.width * FSM.unitsize / 2, location.entrance.top + FSM.player.height * FSM.unitsize);
            FSM.animations.animatePlayerPipingStart(FSM.player);
            FSM.AudioPlayer.play("Pipe");
            FSM.AudioPlayer.addEventListener("Pipe", "ended", function () {
                FSM.AudioPlayer.playTheme();
            });
            FSM.TimeHandler.addEventInterval(function () {
                FSM.shiftVert(FSM.player, FSM.unitsize / -4);
                if (FSM.player.bottom <= location.entrance.top) {
                    FSM.animations.animatePlayerPipingEnd(FSM.player);
                    return true;
                }
                return false;
            }, 1, Infinity);
        };
        Transports.prototype.mapEntrancePipeHorizontal = function (FSM, location) {
            throw new Error("mapEntrancePipeHorizontal is not yet implemented.");
        };
        Transports.prototype.mapEntranceRespawn = function (FSM) {
            FSM.MapScreener.nokeys = false;
            FSM.MapScreener.notime = false;
            FSM.MapScreener.canscroll = true;
            FSM.addPlayer(FSM.unitsize * 16, 0);
            FSM.animations.animateFlicker(FSM.player);
            if (!FSM.MapScreener.underwater) {
                FSM.playerAddRestingStone(FSM.player);
            }
            FSM.ModAttacher.fireEvent("onPlayerRespawn");
        };
        Transports.prototype.mapExitPipeVertical = function (thing, other) {
            if (!thing.resting || typeof (other.transport) === "undefined"
                || thing.right + thing.FSM.unitsize * 2 > other.right
                || thing.left - thing.FSM.unitsize * 2 < other.left) {
                return;
            }
            thing.FSM.animations.animatePlayerPipingStart(thing);
            thing.FSM.AudioPlayer.play("Pipe");
            thing.FSM.TimeHandler.addEventInterval(function () {
                thing.FSM.shiftVert(thing, thing.FSM.unitsize / 4);
                if (thing.top <= other.top) {
                    return false;
                }
                thing.FSM.TimeHandler.addEvent(function () {
                    if (other.transport.constructor === Object) {
                        thing.FSM.setMap(other.transport.map);
                    }
                    else {
                        thing.FSM.setLocation(other.transport);
                    }
                }, 42);
                return true;
            }, 1, Infinity);
        };
        Transports.prototype.mapExitPipeHorizontal = function (thing, other, shouldTransport) {
            if (!shouldTransport && !thing.resting && !thing.paddling) {
                return;
            }
            if (thing.top < other.top || thing.bottom > other.bottom) {
                return;
            }
            if (!thing.keys.run) {
                return;
            }
            thing.FSM.animations.animatePlayerPipingStart(thing);
            thing.FSM.AudioPlayer.play("Pipe");
            thing.FSM.TimeHandler.addEventInterval(function () {
                thing.FSM.shiftHoriz(thing, thing.FSM.unitsize / 4);
                if (thing.left <= other.left) {
                    return false;
                }
                thing.FSM.TimeHandler.addEvent(function () {
                    thing.FSM.setLocation(other.transport);
                }, 42);
                return true;
            }, 1, Infinity);
        };
        return Transports;
    })();
    FullScreenMario.Transports = Transports;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario_1) {
    "use strict";
    var FullScreenMario = (function (_super) {
        __extends(FullScreenMario, _super);
        function FullScreenMario(settings) {
            _super.call(this, FullScreenMario.settings, GameStartr.GameStartr.prototype.proliferate({
                constantsSource: FullScreenMario,
                constants: ["unitsize", "scale", "gravity", "pointLevels", "customTextMappings"]
            }, settings));
            this.animations = new FullScreenMario_1.Animations();
            this.collisions = new FullScreenMario_1.Collisions();
            this.cutscenes = new FullScreenMario_1.Cutscenes();
            this.deaths = new FullScreenMario_1.Deaths(this);
            this.inputs = new FullScreenMario_1.Inputs();
            this.macros = new FullScreenMario_1.Macros();
            this.maintenance = new FullScreenMario_1.Maintenance();
            this.movements = new FullScreenMario_1.Movements();
            this.physics = new FullScreenMario_1.Physics();
            this.scoring = new FullScreenMario_1.Scoring(this);
            this.spawns = new FullScreenMario_1.Spawns();
            this.transports = new FullScreenMario_1.Transports();
            this.deviceMotionStatus = {
                motionLeft: false,
                motionRight: false,
                x: undefined,
                y: undefined,
                dy: undefined
            };
        }
        FullScreenMario.prototype.resetObjectMaker = function (FSM, settings) {
            FSM.ObjectMaker = new ObjectMakr.ObjectMakr(FSM.proliferate({
                properties: {
                    Quadrant: {
                        EightBitter: FSM,
                        GameStarter: FSM,
                        FSM: FSM
                    },
                    Thing: {
                        EightBitter: FSM,
                        GameStarter: FSM,
                        FSM: FSM
                    }
                }
            }, FSM.settings.objects));
        };
        FullScreenMario.prototype.resetAudioPlayer = function (FSM, settings) {
            _super.prototype.resetAudioPlayer.call(this, FSM, settings);
            FSM.AudioPlayer.setGetVolumeLocal(FSM.getVolumeLocal.bind(FSM, FSM));
            FSM.AudioPlayer.setGetThemeDefault(FSM.getAudioThemeDefault.bind(FSM, FSM));
        };
        FullScreenMario.prototype.resetAreaSpawner = function (FSM, settings) {
            FSM.AreaSpawner = new AreaSpawnr.AreaSpawnr({
                "MapsCreator": FSM.MapsCreator,
                "MapScreener": FSM.MapScreener,
                "screenAttributes": FSM.settings.maps.screenAttributes,
                "onSpawn": FSM.settings.maps.onSpawn.bind(FSM),
                "stretchAdd": FSM.mapAddStretched.bind(FSM),
                "afterAdd": FSM.mapAddAfter.bind(FSM)
            });
        };
        FullScreenMario.prototype.resetItemsHolder = function (FSM, settings) {
            _super.prototype.resetItemsHolder.call(this, FSM, settings);
            if (settings.width < 560) {
                FSM.ItemsHolder.getContainer().children[0].cells[4].style.display = "none";
            }
        };
        FullScreenMario.prototype.resetMathDecider = function (FSM, customs) {
            FSM.MathDecider = new MathDecidr.MathDecidr(FSM.proliferate({
                "constants": FSM.MapScreener
            }, FSM.settings.math));
        };
        FullScreenMario.prototype.resetContainer = function (FSM, settings) {
            _super.prototype.resetContainer.call(this, FSM, settings);
            FSM.container.style.fontFamily = "Press Start";
            FSM.container.className += " FullScreenMario";
            FSM.PixelDrawer.setThingArrays([
                FSM.GroupHolder.getGroup("Scenery"),
                FSM.GroupHolder.getGroup("Solid"),
                FSM.GroupHolder.getGroup("Character"),
                FSM.GroupHolder.getGroup("Text")
            ]);
            FSM.ItemsHolder.getContainer().style.width = settings.width + "px";
            FSM.container.appendChild(FSM.ItemsHolder.getContainer());
        };
        FullScreenMario.prototype.gameStart = function () {
            this.setMap(this.settings.maps.mapDefault, this.settings.maps.locationDefault);
            this.ItemsHolder.setItem("lives", this.settings.items.values.lives.valueDefault);
            this.ModAttacher.fireEvent("onGameStart");
        };
        FullScreenMario.prototype.gameOver = function () {
            var _this = this;
            var text = this.ObjectMaker.make("CustomText", {
                "texts": [{
                        "text": "GAME OVER"
                    }]
            }), texts, textWidth, i;
            this.deaths.killNPCs();
            this.AudioPlayer.clearAll();
            this.AudioPlayer.play("Game Over");
            this.GroupHolder.clearArrays();
            this.ItemsHolder.hideContainer();
            this.TimeHandler.cancelAllEvents();
            this.PixelDrawer.setBackground("black");
            this.addThing(text, this.MapScreener.width / 2, this.MapScreener.height / 2);
            texts = text.children;
            textWidth = -(texts[texts.length - 1].right - texts[0].left) / 2;
            for (i = 0; i < texts.length; i += 1) {
                this.shiftHoriz(texts[i], textWidth);
            }
            this.TimeHandler.addEvent(function () {
                _this.gameStart();
                _this.ItemsHolder.displayContainer();
            }, 420);
            this.ModAttacher.fireEvent("onGameOver");
        };
        FullScreenMario.prototype.thingProcess = function (thing, title, settings, defaults) {
            if (thing.height === "Infinity" || thing.height === Infinity) {
                thing.height = thing.FSM.getAbsoluteHeight(thing.y) / thing.FSM.unitsize;
            }
            _super.prototype.thingProcess.call(this, thing, title, settings, defaults);
            thing.FSM.ThingHitter.cacheChecksForType(thing.title, thing.groupType);
        };
        FullScreenMario.prototype.generateThingKey = function (thing) {
            return thing.GameStarter.AreaSpawner.getArea().setting
                + " " + thing.groupType + " "
                + thing.title + " " + thing.className;
        };
        FullScreenMario.prototype.addPreThing = function (prething) {
            var thing = prething.thing, position = prething.position || thing.position;
            thing.FSM.addThing(thing, prething.left * thing.FSM.unitsize - thing.FSM.MapScreener.left, (thing.FSM.MapScreener.floor - prething.top) * thing.FSM.unitsize);
            if (position) {
                thing.FSM.TimeHandler.addEvent(function () {
                    switch (position) {
                        case "beginning":
                            thing.FSM.arrayToBeginning(thing, thing.FSM.GroupHolder.getGroup(thing.groupType));
                            break;
                        case "end":
                            thing.FSM.arrayToEnd(thing, thing.FSM.GroupHolder.getGroup(thing.groupType));
                            break;
                        default:
                            break;
                    }
                });
            }
            thing.FSM.ModAttacher.fireEvent("onAddPreThing", prething);
        };
        FullScreenMario.prototype.addPlayer = function (left, bottom) {
            var _this = this;
            if (left === void 0) { left = this.unitsize * 16; }
            if (bottom === void 0) { bottom = this.unitsize * 16; }
            var player;
            player = this.player = this.ObjectMaker.make("Player", {
                "power": this.ItemsHolder.getItem("power")
            });
            player.keys = player.getKeys();
            if (this.MapScreener.underwater) {
                player.swimming = true;
                this.TimeHandler.addClassCycle(player, ["swim1", "swim2"], "swimming", 5);
                this.TimeHandler.addEventInterval(function () { return _this.animations.animatePlayerBubbling(player); }, 96, Infinity);
            }
            this.setPlayerSizeSmall(player);
            if (player.power >= 2) {
                this.playerGetsBig(player, true);
                if (player.power === 3) {
                    this.playerGetsFire(player);
                }
            }
            this.addThing(player, left, bottom - player.height * this.unitsize);
            this.ModAttacher.fireEvent("onAddPlayer", player);
            return player;
        };
        FullScreenMario.prototype.scrollPlayer = function (dx, dy) {
            this.scrollThing(this.player, dx, dy);
            this.ModAttacher.fireEvent("onScrollPlayer", dx, dy);
        };
        FullScreenMario.prototype.onGamePause = function (FSM) {
            FSM.AudioPlayer.pauseAll();
            FSM.AudioPlayer.play("Pause");
            FSM.ModAttacher.fireEvent("onGamePause");
        };
        FullScreenMario.prototype.onGamePlay = function (FSM) {
            FSM.AudioPlayer.resumeAll();
            FSM.ModAttacher.fireEvent("onGamePlay");
        };
        FullScreenMario.prototype.gainLife = function (amount, nosound) {
            amount = Number(amount) || 1;
            this.ItemsHolder.increase("lives", amount);
            if (!nosound) {
                this.AudioPlayer.play("Gain Life");
            }
            this.ModAttacher.fireEvent("onGainLife", amount);
        };
        FullScreenMario.prototype.itemJump = function (thing) {
            thing.yvel -= FullScreenMario.unitsize * 1.4;
            this.shiftVert(thing, -FullScreenMario.unitsize);
        };
        FullScreenMario.prototype.jumpEnemy = function (thing, other) {
            if (thing.keys.up) {
                thing.yvel = thing.FSM.unitsize * -1.4;
            }
            else {
                thing.yvel = thing.FSM.unitsize * -0.7;
            }
            thing.xvel *= 0.91;
            thing.FSM.AudioPlayer.play("Kick");
            if (!thing.item || other.shell) {
                thing.jumpcount += 1;
                thing.FSM.scoring.scoreOn(thing.FSM.scoring.findScore(thing.jumpcount + thing.jumpers), other);
            }
            thing.jumpers += 1;
            thing.FSM.TimeHandler.addEvent(function (thing) {
                thing.jumpers -= 1;
            }, 1, thing);
        };
        FullScreenMario.prototype.playerShroom = function (thing, other) {
            if (thing.shrooming || !thing.player) {
                return;
            }
            thing.FSM.AudioPlayer.play("Powerup");
            thing.FSM.scoring.scoreOn(1000, thing.FSM.player);
            if (thing.power < 3) {
                thing.FSM.ItemsHolder.increase("power");
                if (thing.power < 3) {
                    thing.shrooming = true;
                    thing.power += 1;
                    if (thing.power === 3) {
                        thing.FSM.playerGetsFire(thing.FSM.player);
                    }
                    else {
                        thing.FSM.playerGetsBig(thing.FSM.player);
                    }
                }
            }
            thing.FSM.ModAttacher.fireEvent("onPlayerShroom", thing, other);
        };
        FullScreenMario.prototype.playerShroom1Up = function (thing, other) {
            if (!thing.player) {
                return;
            }
            thing.FSM.gainLife(1);
            thing.FSM.ModAttacher.fireEvent("onPlayerShroom1Up", thing, other);
        };
        FullScreenMario.prototype.playerStarUp = function (thing, timeout) {
            if (timeout === void 0) { timeout = 560; }
            thing.star += 1;
            thing.FSM.switchClass(thing, "normal fiery", "star");
            thing.FSM.AudioPlayer.play("Powerup");
            thing.FSM.AudioPlayer.addEventListener("Powerup", "ended", thing.FSM.AudioPlayer.playTheme.bind(thing.FSM.AudioPlayer, "Star", true));
            thing.FSM.TimeHandler.addClassCycle(thing, ["star1", "star2", "star3", "star4"], "star", 2);
            thing.FSM.TimeHandler.addEvent(thing.FSM.playerStarDown, timeout || 560, thing);
            thing.FSM.ModAttacher.fireEvent("onPlayerStarUp", thing);
        };
        FullScreenMario.prototype.playerStarDown = function (thing) {
            if (!thing.player) {
                return;
            }
            thing.FSM.TimeHandler.cancelClassCycle(thing, "star");
            thing.FSM.TimeHandler.addClassCycle(thing, [
                "star1", "star2", "star3", "star4"
            ], "star", 5);
            thing.FSM.TimeHandler.addEvent(thing.FSM.playerStarOffCycle, 140, thing);
            thing.FSM.AudioPlayer.removeEventListeners("Powerup", "ended");
            thing.FSM.ModAttacher.fireEvent("onPlayerStarDown", thing);
        };
        FullScreenMario.prototype.playerStarOffCycle = function (thing) {
            if (!thing.player) {
                return;
            }
            if (thing.star > 1) {
                thing.star -= 1;
                return;
            }
            if (!thing.FSM.AudioPlayer.getTheme().paused) {
                thing.FSM.AudioPlayer.playTheme();
            }
            thing.FSM.TimeHandler.addEvent(thing.FSM.playerStarOffFinal, 70, thing);
            thing.FSM.ModAttacher.fireEvent("onPlayerStarOffCycle", thing);
        };
        FullScreenMario.prototype.playerStarOffFinal = function (thing) {
            if (!thing.player) {
                return;
            }
            thing.star -= 1;
            thing.FSM.TimeHandler.cancelClassCycle(thing, "star");
            thing.FSM.removeClasses(thing, "star star1 star2 star3 star4");
            thing.FSM.addClass(thing, "normal");
            if (thing.power === 3) {
                thing.FSM.addClass(thing, "fiery");
            }
            thing.FSM.ModAttacher.fireEvent("onPlayerStarOffFinal", thing);
        };
        FullScreenMario.prototype.playerGetsBig = function (thing, noAnimation) {
            thing.FSM.setPlayerSizeLarge(thing);
            thing.FSM.removeClasses(thing, "crouching small");
            thing.FSM.updateBottom(thing, 0);
            thing.FSM.updateSize(thing);
            if (noAnimation) {
                thing.FSM.addClass(thing, "large");
            }
            else {
                thing.FSM.playerGetsBigAnimation(thing);
            }
            thing.FSM.ModAttacher.fireEvent("onPlayerGetsBig", thing);
        };
        FullScreenMario.prototype.playerGetsBigAnimation = function (thing) {
            var stages = [
                "shrooming1", "shrooming2",
                "shrooming1", "shrooming2",
                "shrooming3", "shrooming2", "shrooming3"
            ];
            thing.FSM.addClass(thing, "shrooming");
            thing.FSM.animations.animateCharacterPauseVelocity(thing);
            stages.push(function (thing) {
                thing.shrooming = false;
                stages.length = 0;
                thing.FSM.addClass(thing, "large");
                thing.FSM.removeClasses(thing, "shrooming shrooming3");
                thing.FSM.animations.animateCharacterResumeVelocity(thing);
                return true;
            });
            thing.FSM.TimeHandler.addClassCycle(thing, stages, "shrooming", 6);
        };
        FullScreenMario.prototype.playerGetsSmall = function (thing) {
            var bottom = thing.bottom;
            thing.FSM.animations.animateCharacterPauseVelocity(thing);
            thing.nocollidechar = true;
            thing.FSM.animations.animateFlicker(thing);
            thing.FSM.removeClasses(thing, "running skidding jumping fiery");
            thing.FSM.addClasses(thing, "paddling small");
            thing.FSM.TimeHandler.addEvent(function (thing) {
                thing.FSM.removeClass(thing, "large");
                thing.FSM.setPlayerSizeSmall(thing);
                thing.FSM.setBottom(thing, bottom - FullScreenMario.unitsize);
            }, 21, thing);
            thing.FSM.TimeHandler.addEvent(function (thing) {
                thing.FSM.animations.animateCharacterResumeVelocity(thing, false);
                thing.FSM.removeClass(thing, "paddling");
                if (thing.running || thing.xvel) {
                    thing.FSM.addClass(thing, "running");
                }
                thing.FSM.PixelDrawer.setThingSprite(thing);
            }, 42, thing);
            thing.FSM.TimeHandler.addEvent(function (thing) {
                thing.nocollidechar = false;
            }, 70, thing);
            thing.FSM.ModAttacher.fireEvent("onPlayerGetsSmall");
        };
        FullScreenMario.prototype.playerGetsFire = function (thing) {
            thing.shrooming = false;
            if (!thing.star) {
                thing.FSM.addClass(thing, "fiery");
            }
            thing.FSM.ModAttacher.fireEvent("onPlayerGetsFire");
        };
        FullScreenMario.prototype.setPlayerSizeSmall = function (thing) {
            thing.FSM.setSize(thing, 8, 8, true);
            thing.FSM.updateSize(thing);
        };
        FullScreenMario.prototype.setPlayerSizeLarge = function (thing) {
            thing.FSM.setSize(thing, 8, 16, true);
            thing.FSM.updateSize(thing);
        };
        FullScreenMario.prototype.unattachPlayer = function (thing, other) {
            thing.nofall = false;
            thing.nocollide = false;
            thing.checkOverlaps = true;
            thing.attachedSolid = undefined;
            thing.xvel = thing.keys ? thing.keys.run : 0;
            thing.movement = thing.FSM.movements.movePlayer;
            thing.FSM.addClass(thing, "jumping");
            thing.FSM.removeClasses(thing, "climbing", "animated");
            other.attachedCharacter = undefined;
        };
        FullScreenMario.prototype.playerAddRestingStone = function (thing) {
            var stone = thing.FSM.addThing("RestingStone", thing.left, thing.top + thing.FSM.unitsize * 48);
            thing.nocollide = true;
            thing.FSM.TimeHandler.addEventInterval(function () {
                if (thing.bottom < stone.top) {
                    return false;
                }
                thing.nocollide = false;
                thing.FSM.setMidXObj(stone, thing);
                thing.FSM.setBottom(thing, stone.top);
                return true;
            }, 1, Infinity);
        };
        FullScreenMario.prototype.markOverlap = function (thing, other) {
            if (!thing.overlaps) {
                thing.overlaps = [other];
            }
            else {
                thing.overlaps.push(other);
            }
        };
        FullScreenMario.prototype.activateCheepsStart = function (thing) {
            thing.FSM.MapScreener.spawningCheeps = true;
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.spawns.spawnRandomCheep, 21, Infinity, thing.FSM);
        };
        FullScreenMario.prototype.activateCheepsStop = function (thing) {
            thing.FSM.MapScreener.spawningCheeps = false;
        };
        FullScreenMario.prototype.activateBulletBillsStart = function (thing) {
            thing.FSM.MapScreener.spawningBulletBills = true;
            thing.FSM.TimeHandler.addEventInterval(thing.FSM.spawns.spawnRandomBulletBill, 210, Infinity, thing.FSM);
        };
        FullScreenMario.prototype.activateBulletBillsStop = function (thing) {
            thing.FSM.MapScreener.spawningBulletBills = false;
        };
        FullScreenMario.prototype.activateLakituStop = function (thing) {
            var lakitu = thing.FSM.MapScreener.lakitu;
            if (!lakitu) {
                return;
            }
            lakitu.fleeing = true;
            lakitu.movement = thing.FSM.movements.moveLakituFleeing;
        };
        FullScreenMario.prototype.activateWarpWorld = function (thing, other) {
            var collection = other.collection, key = 0, keyString, texts, j;
            if (!thing.player) {
                return;
            }
            texts = collection.Welcomer.children;
            for (j = 0; j < texts.length; j += 1) {
                if (texts[j].title !== "TextSpace") {
                    texts[j].hidden = false;
                }
            }
            while (true) {
                keyString = key + "-Text";
                if (!collection.hasOwnProperty(keyString)) {
                    break;
                }
                texts = collection[keyString].children;
                for (j = 0; j < texts.length; j += 1) {
                    if (texts[j].title !== "TextSpace") {
                        texts[j].hidden = false;
                    }
                }
                thing.FSM.deaths.killNormal(collection[key + "-Piranha"]);
                key += 1;
            }
        };
        FullScreenMario.prototype.activateRestingStone = function (thing, other) {
            if (thing.activated) {
                return;
            }
            thing.activated = true;
            thing.opacity = 1;
            thing.FSM.AudioPlayer.playTheme();
            thing.FSM.TimeHandler.addEventInterval(function () {
                if (other.resting === thing) {
                    return false;
                }
                thing.FSM.deaths.killNormal(thing);
                return true;
            }, 1, Infinity);
        };
        FullScreenMario.prototype.activateWindowDetector = function (thing) {
            if (thing.FSM.MapScreener.right - thing.FSM.MapScreener.left < thing.left) {
                return;
            }
            thing.activate(thing);
            thing.FSM.deaths.killNormal(thing);
        };
        FullScreenMario.prototype.activateScrollBlocker = function (thing) {
            var dx = thing.FSM.MapScreener.width - thing.left;
            thing.FSM.MapScreener.canscroll = false;
            if (thing.setEdge && dx > 0) {
                thing.FSM.scrollWindow(-dx);
            }
        };
        FullScreenMario.prototype.activateScrollEnabler = function (thing) {
            thing.FSM.MapScreener.canscroll = true;
        };
        FullScreenMario.prototype.activateSectionBefore = function (thing) {
            var FSM = thing.FSM, MapsCreator = FSM.MapsCreator, MapScreener = FSM.MapScreener, AreaSpawner = FSM.AreaSpawner, area = AreaSpawner.getArea(), map = AreaSpawner.getMap(), prethings = AreaSpawner.getPreThings(), section = area.sections[thing.section || 0], left = (thing.left + MapScreener.left) / FSM.unitsize, before = section.before ? section.before.creation : undefined, command, i;
            if (before) {
                for (i = 0; i < before.length; i += 1) {
                    command = FSM.proliferate({}, before[i]);
                    if (!command.x) {
                        command.x = left;
                    }
                    else {
                        command.x += left;
                    }
                    if (command.sliding) {
                        command.begin += left;
                        command.end += left;
                    }
                    MapsCreator.analyzePreSwitch(command, prethings, area, map);
                }
            }
            command = {
                "thing": "DetectWindow",
                "x": left + (before ? section.before.width : 0), "y": 0,
                "activate": FSM.activateSectionStretch,
                "section": thing.section || 0
            };
            MapsCreator.analyzePreSwitch(command, prethings, area, map);
            AreaSpawner.spawnArea("xInc", MapScreener.top / FSM.unitsize, (MapScreener.left + FSM.QuadsKeeper.right) / FSM.unitsize, MapScreener.bottom / FSM.unitsize, left);
        };
        FullScreenMario.prototype.activateSectionStretch = function (thing) {
            var FSM = thing.FSM, MapsCreator = FSM.MapsCreator, MapScreener = FSM.MapScreener, AreaSpawner = FSM.AreaSpawner, area = AreaSpawner.getArea(), map = AreaSpawner.getMap(), prethings = AreaSpawner.getPreThings(), section = area.sections[thing.section || 0], stretch = section.stretch ? section.stretch.creation : undefined, left = (thing.left + MapScreener.left) / FSM.unitsize, width = MapScreener.width / FSM.unitsize, command, i;
            if (stretch) {
                for (i = 0; i < stretch.length; i += 1) {
                    command = FSM.proliferate({}, stretch[i]);
                    command.x = left;
                    command.width = width;
                    MapsCreator.analyzePreSwitch(command, prethings, area, map);
                }
                command = {
                    "thing": "DetectWindow",
                    "x": left + width,
                    "y": 0,
                    "activate": FSM.activateSectionAfter,
                    "section": thing.section || 0
                };
                MapsCreator.analyzePreSwitch(command, prethings, area, map);
            }
            AreaSpawner.spawnArea("xInc", MapScreener.top / FSM.unitsize, left + (MapScreener.width / FSM.unitsize), MapScreener.bottom / FSM.unitsize, left);
        };
        FullScreenMario.prototype.activateSectionAfter = function (thing) {
            var FSM = thing.FSM, MapsCreator = FSM.MapsCreator, MapScreener = FSM.MapScreener, AreaSpawner = FSM.AreaSpawner, area = AreaSpawner.getArea(), map = AreaSpawner.getMap(), prethings = AreaSpawner.getPreThings(), section = area.sections[thing.section || 0], left = (thing.left + MapScreener.left) / FSM.unitsize, after = section.after ? section.after.creation : undefined, command, i;
            if (after) {
                for (i = 0; i < after.length; i += 1) {
                    command = FSM.proliferate({}, after[i]);
                    if (!command.x) {
                        command.x = left;
                    }
                    else {
                        command.x += left;
                    }
                    if (command.sliding) {
                        command.begin += left;
                        command.end += left;
                    }
                    MapsCreator.analyzePreSwitch(command, prethings, area, map);
                }
            }
            AreaSpawner.spawnArea("xInc", MapScreener.top / FSM.unitsize, left + (MapScreener.right / FSM.unitsize), MapScreener.bottom / FSM.unitsize, left);
        };
        FullScreenMario.prototype.lookTowardsThing = function (thing, other) {
            if (other.right <= thing.left) {
                thing.lookleft = true;
                thing.moveleft = true;
                thing.FSM.unflipHoriz(thing);
            }
            else if (other.left >= thing.right) {
                thing.lookleft = false;
                thing.moveleft = false;
                thing.FSM.flipHoriz(thing);
            }
        };
        FullScreenMario.prototype.lookTowardsPlayer = function (thing, big) {
            if (thing.FSM.player.right <= thing.left) {
                if (!thing.lookleft || big) {
                    thing.lookleft = true;
                    thing.moveleft = false;
                    thing.FSM.unflipHoriz(thing);
                }
            }
            else if (thing.FSM.player.left >= thing.right) {
                if (thing.lookleft || big) {
                    thing.lookleft = false;
                    thing.moveleft = true;
                    thing.FSM.flipHoriz(thing);
                }
            }
        };
        FullScreenMario.prototype.getVolumeLocal = function (FSM, xloc) {
            if (xloc > FSM.MapScreener.right) {
                return 0;
            }
            return Math.max(.14, Math.min(.84, (FSM.MapScreener.width - Math.abs(xloc - FSM.player.left)) / FSM.MapScreener.width));
        };
        FullScreenMario.prototype.getAudioThemeDefault = function (FSM) {
            return FSM.AreaSpawner.getArea().setting.split(" ")[0];
        };
        FullScreenMario.prototype.setMap = function (name, location) {
            var time, map;
            if (typeof name === "undefined" || name.constructor === FullScreenMario) {
                name = this.AreaSpawner.getMapName();
            }
            map = this.AreaSpawner.setMap(name);
            this.ModAttacher.fireEvent("onPreSetMap", map);
            if (map.seed) {
                this.NumberMaker.resetFromSeed(map.seed);
            }
            this.ItemsHolder.setItem("world", name);
            this.InputWriter.restartHistory();
            this.ModAttacher.fireEvent("onSetMap", map);
            this.setLocation(location || map.locationDefault || this.settings.maps.locationDefault);
            time = this.AreaSpawner.getArea().time || this.AreaSpawner.getMap().time;
            this.ItemsHolder.setItem("time", Number(time));
        };
        FullScreenMario.prototype.setLocation = function (name) {
            if (name === void 0) { name = 0; }
            var location;
            this.MapScreener.nokeys = false;
            this.MapScreener.notime = false;
            this.MapScreener.canscroll = true;
            this.MapScreener.clearScreen();
            this.GroupHolder.clearArrays();
            this.TimeHandler.cancelAllEvents();
            this.AreaSpawner.setLocation((name || 0).toString());
            this.MapScreener.setVariables();
            location = this.AreaSpawner.getLocation((name || 0).toString());
            this.ModAttacher.fireEvent("onPreSetLocation", location);
            this.PixelDrawer.setBackground(this.AreaSpawner.getArea().background);
            this.TimeHandler.addEventInterval(this.maintenance.maintainTime, 25, Infinity, this);
            this.TimeHandler.addEventInterval(this.maintenance.maintainScenery, 350, Infinity, this);
            this.AudioPlayer.clearAll();
            this.AudioPlayer.playTheme();
            this.QuadsKeeper.resetQuadrants();
            location.entry(this, location);
            this.ModAttacher.fireEvent("onSetLocation", location);
            this.GamesRunner.play();
        };
        FullScreenMario.prototype.initializeArea = function () {
            var scope = this, i;
            if (scope.attributes) {
                for (i in scope.attributes) {
                    if (scope.hasOwnProperty(i) && scope[i]) {
                        FullScreenMario.prototype.proliferate(scope, scope.attributes[i]);
                    }
                }
            }
            scope.setBackground(scope);
        };
        FullScreenMario.prototype.setAreaBackground = function (area) {
            if (area.setting.indexOf("Underwater") === -1
                && (area.setting.indexOf("Underworld") !== -1
                    || area.setting.indexOf("Castle") !== -1
                    || area.setting.indexOf("Night") !== -1)) {
                area.background = "#000000";
            }
            else {
                area.background = "#5c94fc";
            }
        };
        FullScreenMario.prototype.getAbsoluteHeight = function (yloc, correctUnitsize) {
            var height = yloc + this.MapScreener.height;
            if (!correctUnitsize) {
                height *= this.unitsize;
            }
            return height;
        };
        FullScreenMario.prototype.mapAddStretched = function (prethingRaw) {
            var boundaries = this.AreaSpawner.getArea().boundaries, prething = prethingRaw instanceof String
                ? { "thing": prething }
                : prethingRaw, y = ((this.MapScreener.floor - prething.y)
                * this.unitsize), thing = this.ObjectMaker.make(prething.thing, {
                "width": boundaries.right - boundaries.left,
                "height": prething.height || this.getAbsoluteHeight(prething.y)
            });
            return this.addThing(thing, boundaries.left, y);
        };
        FullScreenMario.prototype.mapAddAfter = function (prethingRaw) {
            var MapsCreator = this.MapsCreator, AreaSpawner = this.AreaSpawner, prethings = AreaSpawner.getPreThings(), prething = prethingRaw instanceof String
                ? {
                    "thing": prething
                }
                : prethingRaw, area = AreaSpawner.getArea(), map = AreaSpawner.getMap(), boundaries = this.AreaSpawner.getArea().boundaries;
            prething.x = boundaries.right;
            MapsCreator.analyzePreSwitch(prething, prethings, area, map);
        };
        FullScreenMario.settings = {
            "audio": undefined,
            "collisions": undefined,
            "devices": undefined,
            "editor": undefined,
            "generator": undefined,
            "groups": undefined,
            "events": undefined,
            "help": undefined,
            "input": undefined,
            "math": undefined,
            "maps": undefined,
            "mods": undefined,
            "objects": undefined,
            "quadrants": undefined,
            "renderer": undefined,
            "runner": undefined,
            "scenes": undefined,
            "sprites": undefined,
            "items": undefined,
            "touch": undefined,
            "ui": undefined
        };
        FullScreenMario.unitsize = 4;
        FullScreenMario.scale = 2;
        FullScreenMario.gravity = Math.round(12 * FullScreenMario.unitsize) / 100;
        FullScreenMario.pointLevels = [100, 200, 400, 500, 800, 1000, 2000, 4000, 5000, 8000];
        FullScreenMario.customTextMappings = {
            " ": "Space",
            ".": "Period",
            "!": "ExclamationMark",
            ":": "Colon",
            "/": "Slash",
            "©": "Copyright"
        };
        return FullScreenMario;
    })(GameStartr.GameStartr);
    FullScreenMario_1.FullScreenMario = FullScreenMario;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    var Deaths = (function () {
        function Deaths(FSM) {
            this.FSM = FSM;
        }
        Deaths.prototype.killNormal = function (thing) {
            if (!thing) {
                return;
            }
            thing.hidden = thing.dead = true;
            thing.alive = false;
            thing.numquads = 0;
            thing.movement = undefined;
            if (thing.hasOwnProperty("resting")) {
                thing.resting = undefined;
            }
            if (thing.FSM) {
                thing.FSM.TimeHandler.cancelAllCycles(thing);
            }
            thing.FSM.ModAttacher.fireEvent("onKillNormal", thing);
        };
        Deaths.prototype.killFlip = function (thing, extra) {
            if (extra === void 0) { extra = 0; }
            thing.FSM.flipVert(thing);
            if (thing.bottomBump) {
                thing.bottomBump = undefined;
            }
            thing.nocollide = thing.dead = true;
            thing.speed = thing.xvel = 0;
            thing.nofall = false;
            thing.resting = thing.movement = undefined;
            thing.yvel = -thing.FSM.unitsize;
            thing.FSM.TimeHandler.addEvent(thing.FSM.deaths.killNormal, 70 + extra, thing);
        };
        Deaths.prototype.killSpawn = function (thing, big) {
            if (big) {
                thing.FSM.deaths.killNormal(thing);
                return;
            }
            if (!thing.spawnType) {
                throw new Error("Thing " + thing.title + " has no .spawnType.");
            }
            var spawn = thing.FSM.ObjectMaker.make(thing.spawnType, thing.spawnSettings || {});
            thing.FSM.addThing(spawn);
            thing.FSM.setBottom(spawn, thing.bottom);
            thing.FSM.setMidXObj(spawn, thing);
            thing.FSM.deaths.killNormal(thing);
            return spawn;
        };
        Deaths.prototype.killReplace = function (thing, title, attributes, attributesCopied) {
            if (attributes === void 0) { attributes = {}; }
            var spawn, i;
            if (typeof attributesCopied !== "undefined") {
                for (i = 0; i < attributesCopied.length; i += 1) {
                    attributes[attributesCopied[i]] = thing[attributesCopied[i]];
                }
            }
            spawn = thing.FSM.ObjectMaker.make(title, attributes);
            if (thing.flipHoriz) {
                thing.FSM.flipHoriz(spawn);
            }
            if (thing.flipVert) {
                thing.FSM.flipVert(spawn);
            }
            thing.FSM.addThing(spawn, thing.left, thing.top);
            thing.FSM.deaths.killNormal(thing);
            return spawn;
        };
        Deaths.prototype.killGoomba = function (thing, big) {
            if (big) {
                thing.FSM.deaths.killFlip(thing);
                return;
            }
            thing.FSM.deaths.killSpawn(thing);
        };
        Deaths.prototype.killKoopa = function (thing, big) {
            var spawn;
            if (thing.jumping || thing.floating) {
                spawn = thing.FSM.deaths.killReplace(thing, "Koopa", undefined, ["smart", "direction", "moveleft"]);
                spawn.xvel = spawn.moveleft ? -spawn.speed : spawn.speed;
            }
            else {
                spawn = thing.FSM.deaths.killToShell(thing, Number(big));
            }
            return spawn;
        };
        Deaths.prototype.killLakitu = function (thing) {
            var characters = thing.FSM.GroupHolder.getGroup("Character"), i;
            thing.FSM.deaths.killFlip(thing);
            thing.FSM.MapScreener.lakitu = undefined;
            for (i = 0; i < characters.length; i += 1) {
                if (characters[i].title === "Lakitu") {
                    thing.FSM.MapScreener.lakitu = characters[i];
                    return;
                }
            }
            thing.FSM.TimeHandler.addEvent(thing.FSM.addThing.bind(thing.FSM), 350, "Lakitu", thing.FSM.MapScreener.right, thing.top);
        };
        Deaths.prototype.killBowser = function (thing, big) {
            if (big) {
                thing.nofall = false;
                thing.movement = undefined;
                thing.FSM.deaths.killFlip(thing.FSM.deaths.killSpawn(thing));
                return;
            }
            thing.deathcount += 1;
            if (thing.deathcount === 5) {
                thing.yvel = thing.speed = 0;
                thing.movement = undefined;
                thing.FSM.deaths.killFlip(thing.FSM.deaths.killSpawn(thing), 350);
                thing.FSM.scoring.scoreOn(5000, thing);
            }
        };
        Deaths.prototype.killToShell = function (thing, big) {
            var spawn, nocollidecharold, nocollideplayerold;
            thing.spawnSettings = {
                "smart": thing.smart
            };
            if (big && big !== 2) {
                thing.spawnType = thing.title;
            }
            else {
                thing.spawnType = thing.shelltype || "Shell";
            }
            thing.spawnSettings = {
                "smart": thing.smart
            };
            spawn = thing.FSM.deaths.killSpawn(thing);
            nocollidecharold = spawn.nocollidechar;
            nocollideplayerold = spawn.nocollideplayer;
            spawn.nocollidechar = true;
            spawn.nocollideplayer = true;
            thing.FSM.TimeHandler.addEvent(function () {
                spawn.nocollidechar = nocollidecharold;
                spawn.nocollideplayer = nocollideplayerold;
            }, 7);
            thing.FSM.deaths.killNormal(thing);
            if (big === 2) {
                thing.FSM.deaths.killFlip(spawn);
            }
            return spawn;
        };
        Deaths.prototype.killNPCs = function () {
            var group, character, solid, i;
            group = this.FSM.GroupHolder.getGroup("Character");
            for (i = group.length - 1; i >= 0; --i) {
                character = group[i];
                if (!character.nokillend) {
                    this.killNormal(character);
                    this.FSM.arrayDeleteThing(character, group, i);
                }
                else if (character.killonend) {
                    character.killonend(character);
                }
            }
            group = this.FSM.GroupHolder.getGroup("Solid");
            for (i = group.length - 1; i >= 0; --i) {
                solid = group[i];
                if (solid.killonend) {
                    if (solid.killonend.constructor === Function) {
                        solid.killonend(solid, group, i);
                    }
                    else {
                        this.FSM.arrayDeleteThing(solid, group, i);
                    }
                }
            }
        };
        Deaths.prototype.killBrick = function (thing, other) {
            thing.FSM.AudioPlayer.play("Break Block");
            thing.FSM.TimeHandler.addEvent(thing.FSM.animations.animateBrickShards, 1, thing);
            thing.FSM.deaths.killNormal(thing);
            if (other instanceof thing.FSM.ObjectMaker.getFunction("Thing")) {
                thing.up = other;
            }
            else {
                thing.up = undefined;
            }
        };
        Deaths.prototype.killPlayer = function (thing, big) {
            if (!thing.alive || thing.flickering || thing.dieing) {
                return;
            }
            var FSM = thing.FSM, area = thing.FSM.AreaSpawner.getArea();
            if (big === 2) {
                thing.dead = thing.dieing = true;
                thing.alive = false;
                FSM.MapScreener.notime = true;
            }
            else {
                if (!big && thing.power > 1) {
                    thing.power = 1;
                    FSM.ItemsHolder.setItem("power", 1);
                    FSM.AudioPlayer.play("Power Down");
                    FSM.playerGetsSmall(thing);
                    return;
                }
                else {
                    thing.dieing = true;
                    FSM.setSize(thing, 7.5, 7, true);
                    FSM.updateSize(thing);
                    FSM.setClass(thing, "character player dead");
                    FSM.animations.animateCharacterPauseVelocity(thing);
                    FSM.arrayToEnd(thing, FSM.GroupHolder.getGroup(thing.groupType));
                    FSM.MapScreener.notime = true;
                    FSM.MapScreener.nokeys = true;
                    FSM.TimeHandler.cancelAllCycles(thing);
                    FSM.TimeHandler.addEvent(function () {
                        FSM.animations.animateCharacterResumeVelocity(thing, true);
                        thing.nocollide = true;
                        thing.movement = thing.resting = undefined;
                        thing.gravity = FSM.MapScreener.gravity / 2.1;
                        thing.yvel = FullScreenMario.FullScreenMario.unitsize * -1.4;
                    }, 7);
                }
            }
            thing.nocollide = thing.nomove = thing.dead = true;
            FSM.MapScreener.nokeys = true;
            FSM.AudioPlayer.clearAll();
            FSM.AudioPlayer.play("Player Dies");
            FSM.ItemsHolder.decrease("lives");
            FSM.ItemsHolder.setItem("power", 1);
            if (FSM.ItemsHolder.getItem("lives") > 0) {
                FSM.TimeHandler.addEvent(area.onPlayerDeath.bind(FSM), area.onPlayerDeathTimeout, FSM);
            }
            else {
                FSM.TimeHandler.addEvent(area.onGameOver.bind(FSM), area.onGameOverTimeout, FSM);
            }
        };
        return Deaths;
    })();
    FullScreenMario.Deaths = Deaths;
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    FullScreenMario.FullScreenMario.settings.collisions = {
        "keyGroupName": "groupType",
        "keyTypeName": "title",
        "globalCheckGenerators": {
            "Character": FullScreenMario.Physics.prototype.generateCanThingCollide,
            "Solid": FullScreenMario.Physics.prototype.generateCanThingCollide
        },
        "hitCheckGenerators": {
            "Character": {
                "Character": FullScreenMario.Physics.prototype.generateIsCharacterTouchingCharacter,
                "Solid": FullScreenMario.Physics.prototype.generateIsCharacterTouchingSolid
            }
        },
        "hitCallbackGenerators": {
            "Character": {
                "Solid": FullScreenMario.Physics.prototype.generateHitCharacterSolid,
                "Character": FullScreenMario.Physics.prototype.generateHitCharacterCharacter
            }
        }
    };
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    FullScreenMario.FullScreenMario.settings.help = {
        "globalName": "FSM",
        "aliases": [
            ["{GAME}", "FSM"]
        ],
        "openings": [
            ["%cHi, thanks for playing FullScreenMario!%c :)", "head"],
            ["If you'd like to know the common cheats, enter %c{GAME}.UsageHelper.displayHelpOptions();%c here.", "code"],
            "http://www.github.com/FullScreenShenanigans/FullScreenMario"
        ],
        "options": {
            "Map": [
                {
                    "title": "{GAME}.setMap",
                    "description": "Go to a specified map and location.",
                    "usage": "{GAME}.setMap(<map>[, <location>]);",
                    "examples": [
                        {
                            "code": "{GAME}.setMap(\"1-1\");",
                            "comment": "Starts map 1-1."
                        }, {
                            "code": "{GAME}.setMap(\"1-2\", 1);",
                            "comment": "Starts map 1-2, at the second location."
                        }, {
                            "code": "{GAME}.setMap(\"Random\");",
                            "comment": "Starts the random map."
                        }, {
                            "code": "{GAME}.setMap(\"Random\", \"Underworld\");",
                            "comment": "Starts the random map in the Underworld."
                        }]
                }],
            "Things": [
                {
                    "title": "{GAME}.addThing",
                    "description": "Adds a new Thing to the game.",
                    "usage": "{GAME}.addThing(<thing>, left, top);",
                    "examples": [
                        {
                            "code": "{GAME}.addThing(\"Goomba\", 256, 384);",
                            "comment": "Adds a Goomba to the game."
                        }, {
                            "code": "{GAME}.addThing(\"Mushroom\", {GAME}.player.right + 80, {GAME}.player.top);",
                            "comment": "Adds a Mushroom to the right of the player."
                        }, {
                            "code": "{GAME}.addThing([\"Koopa\", { \"smart\": true }], 256, 368);",
                            "comment": "Adds a smart Koopa to the game."
                        }, {
                            "code": "{GAME}.addThing({GAME}.ObjectMaker.make(\"Koopa\", { \"smart\": true, \"jumping\": true }), 256, 368);",
                            "comment": "Adds a smart jumping Koopa to the game."
                        }]
                }, {
                    "title": "{GAME}.GroupHolder.getGroups",
                    "description": "Gets the groups of in-game Things.",
                    "usage": "{GAME}.GroupHolder.getGroups();"
                }, {
                    "title": "{GAME}.GroupHolder.get*******Group",
                    "description": "Retrieves the group of in-game Things under that name.",
                    "usage": "{GAME}.GroupHolder.get*******Group();",
                    "examples": [
                        {
                            "code": "{GAME}.GroupHolder.getCharacterGroup();",
                            "comment": "Retrieves the currently playing Characters."
                        }]
                }, {
                    "title": "{GAME}.GroupHolder.get*******",
                    "description": "Retrieves the numbered Thing from its group.",
                    "usage": "{GAME}.GroupHolder.get*******(<index>);",
                    "examples": [
                        {
                            "code": "{GAME}.GroupHolder.getCharacter(0);",
                            "comment": "Retrieves the first playing Character."
                        }]
                }],
            "Physics": [
                {
                    "title": "{GAME}.shiftBoth",
                    "description": "Shifts a Thing horizontally and/or vertically.",
                    "usage": "{GAME}.shiftBoth(<thing>, <dx>[, <dy>]);",
                    "examples": [
                        {
                            "code": "{GAME}.shiftBoth({GAME}.player, 700);",
                            "comment": "Shifts the player 700 spaces to the right"
                        }, {
                            "code": "{GAME}.player.resting = undefined;\r\n{GAME}.shiftBoth({GAME}.player, 0, -{GAME}.player.top);",
                            "comment": "Shifts the player to the top of the screen."
                        }]
                }, {
                    "title": "{GAME}.killNormal",
                    "description": "Kills a specified Character with animation.",
                    "usage": "{GAME}.killNormal(<thing>);",
                    "examples": [
                        {
                            "code": "{GAME}.killNormal({GAME}.GroupHolder.getCharacter(0));",
                            "comment": "Kills the first playing Character."
                        }, {
                            "code": "{GAME}.GroupHolder.getSceneryGroup().forEach({GAME}.killNormal.bind(FSM));",
                            "comment": "Kills all playing Scenery."
                        }]
                }, {
                    "title": "{GAME}.player.gravity",
                    "description": "Sets the current Player's gravity.",
                    "usage": "{GAME}.player.gravity = <number>;",
                    "examples": [
                        {
                            "code": "{GAME}.player.gravity = {GAME}.MapScreener.gravity / 2;",
                            "comment": "Sets the player's gravity to half the default."
                        }]
                }],
            "Powerups": [
                {
                    "title": "{GAME}.playerShroom",
                    "description": "Simulates the player hitting a Mushroom.",
                    "usage": "{GAME}.playerShroom({GAME}.player);"
                }, {
                    "title": "{GAME}.playerStarUp",
                    "description": "Simulates the player hitting a Star.",
                    "usage": "{GAME}.playerStarUp({GAME}.player);"
                }],
            "Statistics": [
                {
                    "title": "{GAME}.ItemsHolder.getKeys",
                    "description": "Gets the keys you can manipulate.",
                    "usage": "{GAME}.ItemsHolder.getKeys();"
                }, {
                    "title": "{GAME}.ItemsHolder.setItem",
                    "description": "Sets a stored statitistic to a value.",
                    "usage": "{GAME}.ItemsHolder.setItem(\"<key>\", <number>);",
                    "examples": [
                        {
                            "code": "{GAME}.ItemsHolder.setItem(\"coins\", 77);",
                            "comment": "Sets the number of coins to 77."
                        }, {
                            "code": "{GAME}.ItemsHolder.setItem(\"lives\", 7);",
                            "comment": "Sets the number of lives to seven."
                        }, {
                            "code": "{GAME}.ItemsHolder.setItem(\"lives\", Infinity);",
                            "comment": "Sets the number of lives to Infinity and beyond."
                        }]
                }, {
                    "title": "{GAME}.ItemsHolder.increase",
                    "description": "Increases the number of coins you have.",
                    "usage": "{GAME}.ItemsHolder.increase(\"coins\", <number>);",
                    "examples": [
                        {
                            "code": "{GAME}.ItemsHolder.increase(\"coins\", 7);",
                            "comment": "Increases the number of coins by seven."
                        }]
                }],
            "Mods": [
                {
                    "title": "{GAME}.ModAttacher.getMods",
                    "description": "Gets all the available mods.",
                    "usage": "{GAME}.ItemsHolder.getMods();"
                }, {
                    "title": "{GAME}.ModAttacher.enableMod",
                    "description": "Enables a mod.",
                    "usage": "{GAME}.enableMod(\"<key>\");",
                    "examples": [
                        {
                            "code": "{GAME}.enableMod(\"Gradient Skies\");",
                            "comment": "Enables the \"Gradient Skies\" mod."
                        }]
                }, {
                    "title": "{GAME}.ModAttacher.disableMod",
                    "description": "Disables a mod.",
                    "usage": "{GAME}.disableMod(\"<key>\");",
                    "examples": [
                        {
                            "code": "{GAME}.disableMod(\"Gradient Skies\");",
                            "comment": "Disables the \"Gradient Skies\" mod."
                        }]
                }]
        },
        "optionHelp": "To focus on a group, enter %c{GAME}.UsageHelper.displayHelpOption(\"<group-name>\");%c"
    };
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    FullScreenMario.FullScreenMario.settings.math = {
        "equations": {
            "canPlayerTouchCastleAxe": function (constants, equations, thing, other) {
                if (!thing.FSM.physics.isThingAlive(thing)) {
                    return false;
                }
                if (thing.right < other.left + other.EightBitter.unitsize) {
                    return false;
                }
                if (thing.bottom > other.bottom - other.EightBitter.unitsize) {
                    return false;
                }
                return true;
            },
            "decreasePlayerJumpingYvel": function (constants, equations, player) {
                var jumpmod = player.FSM.MapScreener.jumpmod - player.xvel * .0014, power = Math.pow(player.keys.jumplev, jumpmod), dy = player.FSM.unitsize / power;
                player.yvel = Math.max(player.yvel - dy, constants.maxyvelinv);
            },
            "decreasePlayerRunningXvel": function (constants, equations, player) {
                if (player.keys.run !== 0 && !player.crouching) {
                    var dir = player.keys.run, sprinting = Number(player.keys.sprint && !player.FSM.MapScreener.underwater) || 0, adder = dir * (.098 * (Number(sprinting) + 1)), decel = 0, skiddingChanged = false;
                    player.xvel += adder || 0;
                    player.xvel *= .98;
                    decel = .0007;
                    if ((player.keys.run > 0) === player.moveleft) {
                        if (!player.skidding) {
                            player.skidding = true;
                            skiddingChanged = true;
                        }
                    }
                    else if (player.skidding) {
                        player.skidding = false;
                        skiddingChanged = true;
                    }
                }
                else {
                    player.xvel *= .98;
                    decel = .035;
                }
                if (player.xvel > decel) {
                    player.xvel -= decel;
                }
                else if (player.xvel < -decel) {
                    player.xvel += decel;
                }
                else if (player.xvel !== 0) {
                    player.xvel = 0;
                    if (!player.FSM.MapScreener.nokeys && player.keys.run === 0) {
                        if (player.keys.leftDown) {
                            player.keys.run = -1;
                        }
                        else if (player.keys.rightDown) {
                            player.keys.run = 1;
                        }
                    }
                }
                return skiddingChanged;
            },
            "springboardYvelUp": function (constants, equations, thing) {
                return Math.max(thing.FSM.unitsize * -2, thing.tensionSave * -.98);
            },
            "numberOfFireworks": function (constants, equations, time) {
                var numFireworks = time % 10;
                if (!(numFireworks === 1 || numFireworks === 3 || numFireworks === 6)) {
                    return 0;
                }
                return numFireworks;
            }
        }
    };
})(FullScreenMario || (FullScreenMario = {}));
var FullScreenMario;
(function (FullScreenMario) {
    "use strict";
    FullScreenMario.FullScreenMario.settings.ui = {
        "globalName": "FSM",
        "styleSheet": {
            ".FullScreenMario": {
                "color": "white"
            },
            "@font-face": {
                "font-family": "'Press Start'",
                "src": [
                    "url('Fonts/pressstart2p-webfont.eot')",
                    "url('Fonts/pressstart2p-webfont.eot?#iefix') format('embedded-opentype')",
                    "url('Fonts/pressstart2p-webfont.woff') format('woff')",
                    "url('Fonts/pressstart2p-webfont.ttf') format('truetype')",
                    "url('Fonts/pressstart2p-webfont.svg') format('svg')"
                ].join(", "),
                "font-weight": "normal",
                "font-style": "normal"
            }
        },
        "sizeDefault": "Wide",
        "sizes": {
            "NES": {
                "width": 512,
                "height": 464,
                "full": false
            },
            "Wide": {
                "width": Infinity,
                "height": 464,
                "full": false
            },
            "Large": {
                "width": Infinity,
                "height": Infinity,
                "full": false
            },
            "Full!": {
                "width": Infinity,
                "height": Infinity,
                "full": true
            }
        },
        "schemas": [
            {
                "title": "Options",
                "generator": "OptionsTable",
                "options": [
                    {
                        "title": "Volume",
                        "type": "Number",
                        "minimum": 0,
                        "maximum": 100,
                        "source": function (FSM) {
                            return Math.round(FSM.AudioPlayer.getVolume() * 100);
                        },
                        "update": function (FSM, value) {
                            FSM.AudioPlayer.setVolume(value / 100);
                        }
                    },
                    {
                        "title": "Mute",
                        "type": "Boolean",
                        "source": function (FSM) {
                            return FSM.AudioPlayer.getMuted();
                        },
                        "enable": function (FSM) {
                            FSM.AudioPlayer.setMutedOn();
                        },
                        "disable": function (FSM) {
                            FSM.AudioPlayer.setMutedOff();
                        }
                    },
                    {
                        "title": "Speed",
                        "type": "Select",
                        "options": function (FSM) {
                            return [".25x", ".5x", "1x", "2x", "5x"];
                        },
                        "source": function (FSM) {
                            return "1x";
                        },
                        "update": function (FSM, value) {
                            FSM.GamesRunner.setSpeed(Number(value.replace("x", "")));
                        },
                        "storeLocally": true
                    },
                    {
                        "title": "View Mode",
                        "type": "ScreenSize"
                    },
                    {
                        "title": "Framerate",
                        "type": "Select",
                        "options": function (FSM) {
                            return ["60fps", "30fps"];
                        },
                        "source": function (FSM) {
                            return (1 / FSM.PixelDrawer.getFramerateSkip() * 60) + "fps";
                        },
                        "update": function (FSM, value) {
                            FSM.PixelDrawer.setFramerateSkip(1 / Number(value.replace("fps", "")) * 60);
                        },
                        "storeLocally": true
                    },
                    {
                        "title": "Touch Controls",
                        "type": "Boolean",
                        "storeLocally": true,
                        "source": function (FSM) { return false; },
                        "enable": function (FSM) {
                            setTimeout(function () { return FSM.TouchPasser.enable(); });
                        },
                        "disable": function (FSM) {
                            setTimeout(function () { return FSM.TouchPasser.disable(); });
                        }
                    },
                    {
                        "title": "Tilt Controls",
                        "type": "Boolean",
                        "storeLocally": true,
                        "source": function (FSM) { return false; },
                        "enable": function (FSM) {
                            window.ondevicemotion = FSM.InputWriter.makePipe("ondevicemotion", "type");
                        },
                        "disable": function (FSM) {
                            window.ondevicemotion = undefined;
                        }
                    }
                ],
                "actions": [
                    {
                        "title": "Screenshot",
                        "action": function (FSM) {
                            FSM.takeScreenshot("FullScreenMario " + new Date().getTime());
                        }
                    }
                ]
            }, {
                "title": "Controls",
                "generator": "OptionsTable",
                "options": (function (controls) {
                    return controls.map(function (title) {
                        return {
                            "title": title[0].toUpperCase() + title.substr(1),
                            "type": "Keys",
                            "storeLocally": true,
                            "source": function (FSM) {
                                return FSM.InputWriter
                                    .getAliasAsKeyStrings(title)
                                    .map(function (string) { return string.toLowerCase(); });
                            },
                            "callback": function (FSM, valueOld, valueNew) {
                                FSM.InputWriter.switchAliasValues(title, [FSM.InputWriter.convertKeyStringToAlias(valueOld)], [FSM.InputWriter.convertKeyStringToAlias(valueNew)]);
                            }
                        };
                    });
                })(["left", "right", "up", "down", "sprint", "pause"])
            }, {
                "title": "Mods!",
                "generator": "OptionsButtons",
                "keyActive": "enabled",
                "assumeInactive": true,
                "options": function (FSM) {
                    var mods = FSM.ModAttacher.getMods(), output = [], mod, i;
                    for (i in mods) {
                        if (!mods.hasOwnProperty(i)) {
                            continue;
                        }
                        mod = mods[i];
                        output.push({
                            "title": mod.name,
                            "source": function () { return mod.enabled; },
                            "storeLocally": true,
                            "type": "text"
                        });
                    }
                    return output;
                },
                "callback": function (FSM, schema, button) {
                    var name = button.textContent, key = button.getAttribute("localStorageKey"), mod = FSM.ModAttacher.getMod(name);
                    FSM.ModAttacher.toggleMod(name);
                    FSM.ItemsHolder.setItem(key, mod.enabled);
                    FSM.ItemsHolder.saveItem(key);
                }
            }, {
                "title": "Editor",
                "generator": "LevelEditor",
                "maps": {
                    "rangeX": [1, 4],
                    "rangeY": [1, 8],
                    "callback": function (FSM, schema, button) {
                        FSM.LevelEditor.enable();
                        FSM.LevelEditor.setCurrentJSON(JSON.stringify(FSM.MapsCreator.getMapRaw(button.textContent)));
                        FSM.LevelEditor.startBuilding();
                    }
                }
            }, {
                "title": "Maps",
                "generator": "MapsGrid",
                "rangeX": [1, 4],
                "rangeY": [1, 8],
                "extras": [
                    (function () {
                        function getNewSeed() {
                            return new Date().getTime()
                                .toString()
                                .split("")
                                .sort(function () { return 0.5 - Math.random(); })
                                .reverse()
                                .join("");
                        }
                        return {
                            "title": "Map Generator!",
                            "callback": function (FSM, schema, button, event) {
                                var parent = event.target.parentElement, randomizer = parent.querySelector(".randomInput");
                                randomizer.value = randomizer.value.replace(/[^\d]/g, "");
                                if (!randomizer.value) {
                                    randomizer.value = getNewSeed();
                                }
                                FSM.LevelEditor.disable();
                                FSM.NumberMaker.resetFromSeed(Number(randomizer.value));
                                FSM.setMap("Random");
                                if (!randomizer.getAttribute("custom")) {
                                    randomizer.value = getNewSeed();
                                }
                            },
                            "extraElements": [
                                {
                                    "tag": "input",
                                    "options": {
                                        "className": "randomInput maps-grid-input",
                                        "type": "text",
                                        "value": getNewSeed(),
                                        "onchange": function (event) {
                                            event.target.setAttribute("custom", "true");
                                        }
                                    }
                                }
                            ]
                        };
                    })()
                ],
                "callback": function (FSM, schema, button) {
                    FSM.LevelEditor.disable();
                    FSM.setMap(button.getAttribute("value") || button.textContent);
                }
            }
        ]
    };
})(FullScreenMario || (FullScreenMario = {}));
//# sourceMappingURL=FullScreenMario-0.10.4.js.map