// based on https://github.com/fogleman/xy/tree/master/firmware

#include <EEPROM.h>
#include <Servo.h>
#include <SoftwareSerial.h>
#include <Wire.h>

// data stored in eeprom
static union{
    struct{
      char name[8];
      unsigned char motoADir;
      unsigned char motoBDir;
      unsigned char motorSwitch;
      int height;
      int width;
      int speed;
      int penUpPos;
      int penDownPos;
    }data;
    char buf[64];
}roboSetup;

int stepAuxDelay = 0;

#define MS_BEFORE_SERVO_SLEEP 1000
#define SPEED_STEP 1
#define WIDTH 310
#define HEIGHT 380
#define STEPS_PER_MM 87.58 // the same as 3d printer
#define MIN_STEP_DELAY 250
#define MAX_STEP_DELAY 1000

int stepdelay_min;
int stepdelay_max;
int ylimit_pin1 = 12;
int ylimit_pin2 = 13;
int xlimit_pin1 = A2;
int xlimit_pin2 = A3;
int servopin = A1;
Servo servoPen;

float curX, curY, curZ;
float tarX, tarY, tarZ; // target xyz position
int tarA, tarB, posA, posB; // target stepper position
int8_t motorAfw, motorAbk;
int8_t motorBfw, motorBbk;



// ----------------------------------------
// XY MOVES

void stepperMoveA(int dir) {
  if (dir > 0) digitalWrite(11, LOW);
  else digitalWrite(11, HIGH);
  digitalWrite(10, HIGH);
  digitalWrite(10, LOW);
}

void stepperMoveB(int dir) {
  if (dir > 0) digitalWrite(3, LOW);
  else digitalWrite(3, HIGH);
  digitalWrite(9, HIGH);
  digitalWrite(9, LOW);
}

void doMove() {
  int mDelay = stepdelay_max;
  int speedDiff = -SPEED_STEP;
  int dA, dB, maxD;
  float stepA, stepB, cntA = 0, cntB = 0;
  int d;
  dA = tarA - posA;
  dB = tarB - posB;
  maxD = max(abs(dA), abs(dB));
  stepA = (float) abs(dA) / (float)maxD;
  stepB = (float) abs(dB) / (float)maxD;
  for (int i = 0; (posA != tarA) || (posB != tarB); i++) {
    // move A
    if (posA != tarA) {
      cntA += stepA;
      if (cntA >= 1) {
        d = dA > 0 ? motorAfw : motorAbk;
        posA += (dA > 0 ? 1 : -1);
        // don't move passed limit !
        if ((d > 0 && digitalRead(xlimit_pin2) == 1) || (d < 0 && digitalRead(xlimit_pin1) == 1)) stepperMoveA(d);
        cntA -= 1;
      }
    }
    // move B
    if (posB != tarB) {
      cntB += stepB;
      if (cntB >= 1) {
        d = dB > 0 ? motorBfw : motorBbk;
        posB += (dB > 0 ? 1 : -1);
        // don't move passed limit !
        if ((d > 0 && digitalRead(ylimit_pin2) == 1) || (d < 0 && digitalRead(ylimit_pin1) == 1)) stepperMoveB(d);
        cntB -= 1;
      }
    }
    mDelay = constrain(mDelay + speedDiff, stepdelay_min, stepdelay_max) + stepAuxDelay;
    delayMicroseconds(mDelay);
    if ((maxD - i) < ((stepdelay_max - stepdelay_min) / SPEED_STEP)) speedDiff = SPEED_STEP;
  }
  posA = tarA;
  posB = tarB;
}

void prepareMove() {
  float dx = tarX - curX;
  float dy = tarY - curY;
  float distance = sqrt(dx * dx + dy * dy);
  if (distance < 0.001) return;
  tarA = tarX * STEPS_PER_MM;
  tarB = tarY * STEPS_PER_MM;
  doMove();
  curX = tarX;
  curY = tarY;
}

void goHome() {
  // stop on either endstop touches
  while (digitalRead(xlimit_pin2) != 0 || digitalRead(ylimit_pin2) != 0) {
    if (digitalRead(xlimit_pin2) != 0) stepperMoveA(motorAbk);
    if (digitalRead(ylimit_pin2) != 0) stepperMoveB(motorBbk);
    delayMicroseconds(stepdelay_min);
  }
  initPosition();
}

void initPosition() { curX = 0; curY = 0; posA = 0; posB = 0; }



// ----------------------------------------
// PARSING

void parseCoordinate(char * cmd) {
  char * tmp;
  char * str;
  str = strtok_r(cmd, " ", &tmp);
  tarX = curX;
  tarY = curY;
  while (str!=NULL) {
    str = strtok_r(0, " ", &tmp);
    if (str[0] == 'X') tarX = atof(str + 1);
    else if (str[0] == 'Y') tarY = atof(str + 1);
    else if (str[0] == 'Z') tarZ = atof(str + 1);
    else if (str[0] == 'A') stepAuxDelay = atoi(str + 1);
  }
  prepareMove();
}

void parseRobotSetup(char * cmd) {
  char * tmp;
  char * str;
  str = strtok_r(cmd, " ", &tmp);
  while(str!=NULL){
    str = strtok_r(0, " ", &tmp);
    if (str[0] == 'A') roboSetup.data.motoADir = atoi(str + 1);
    else if (str[0] == 'B') roboSetup.data.motoBDir = atoi(str + 1);
    else if (str[0] == 'H') roboSetup.data.height = atoi(str + 1);
    else if (str[0] == 'W') roboSetup.data.width = atoi(str + 1);
    else if (str[0] == 'S') roboSetup.data.speed = atoi(str + 1);
  }
  syncRobotSetup();
}

void parseAuxDelay(char * cmd) {
  char * tmp;
  strtok_r(cmd, " ", &tmp);
  stepAuxDelay = atoi(tmp);
}

void parsePen(char * cmd) {
  char * tmp;
  strtok_r(cmd, " ", &tmp);
  int pos = atoi(tmp);
  servoPen.write(pos);
}

void parsePenPosSetup(char * cmd) {
  char * tmp;
  char * str;
  str = strtok_r(cmd, " ", &tmp);
  while(str!=NULL){
    str = strtok_r(0, " ", &tmp);
    if (str[0] == 'U') roboSetup.data.penUpPos = atoi(str + 1);
    else if (str[0] == 'D') roboSetup.data.penDownPos = atoi(str + 1);
  }
  syncRobotSetup();
}

void parseSCode(char * cmd) {
  int code = atoi(cmd);
  switch(code){
    case 0:
      // reset to non-linear speed
      stepdelay_min = MIN_STEP_DELAY;
      stepdelay_max = MAX_STEP_DELAY;
      break;
    case 1:
      // set stepdelay value
      char * tmp;
      strtok_r(cmd, " ", &tmp);
      int value = atoi(tmp);
      stepdelay_min = value;
      stepdelay_max = value;
      break;
  }
}

void parseMcode(char * cmd) {
  int code = atoi(cmd);
  switch(code){
    case 1:   parsePen(cmd); break;
    case 2:   parsePenPosSetup(cmd); break;
    case 3:   parseAuxDelay(cmd); break;
    case 5:   parseRobotSetup(cmd); break;
    case 10:  echoRobotSetup(); break;
    case 11:  echoEndStop(); break;
  }
}

void parseGcode(char * cmd) {
  int code = atoi(cmd);
  switch(code){
    case 0:
    case 1: parseCoordinate(cmd); break;
    case 28: tarX=0; tarY=0; goHome(); break;
  }
}

void parseCmd(char * cmd) {
  Serial.println("Command received.");
  if (cmd[0] == 'G') parseGcode(cmd + 1);
  else if (cmd[0] == 'M') parseMcode(cmd + 1);
  else if (cmd[0] == 'S') parseSCode(cmd + 1);
  else if (cmd[0] == 'P') echoPosition();
}



// ----------------------------------------
// LOCAL DATA

void initRobotSetup() {
  for(int i = 0; i < 64; i++) roboSetup.buf[i] = EEPROM.read(i);

  if (strncmp(roboSetup.data.name,"XY4", 3) != 0) {
    Serial.println("set to default setup");
    // set to default setup
    memset(roboSetup.buf, 0, 64);
    memcpy(roboSetup.data.name, "XY4", 3);
    roboSetup.data.motoADir = 0;
    roboSetup.data.motoBDir = 0;
    roboSetup.data.width = WIDTH;
    roboSetup.data.height = HEIGHT;
    roboSetup.data.motorSwitch = 0;
    roboSetup.data.speed = 100;
    roboSetup.data.penUpPos = 160;
    roboSetup.data.penDownPos = 90;
    syncRobotSetup();
  }

  // init motor direction
  // yzj, match to standard connection of xy
  // A = x, B = y
  if (roboSetup.data.motoADir == 0) {
    motorAfw = -1;
    motorAbk = 1;
  } else {
    motorAfw = 1;
    motorAbk = -1;
  }
  if (roboSetup.data.motoBDir == 0) {
    motorBfw = -1;
    motorBbk = 1;
  } else {
    motorBfw = 1;
    motorBbk = -1;
  }

  stepdelay_min = MIN_STEP_DELAY;
  stepdelay_max = MAX_STEP_DELAY;
}

void syncRobotSetup() {
  for (int i = 0; i < 64; i++) EEPROM.write(i, roboSetup.buf[i]);
}


// ----------------------------------------
// ARDUINO

char buf[64];
int8_t bufindex;

void setup() {
  pinMode(11, OUTPUT);
  pinMode(10, OUTPUT);
  pinMode(3, OUTPUT);
  pinMode(9, OUTPUT);
  pinMode(ylimit_pin1, INPUT_PULLUP);
  pinMode(ylimit_pin2, INPUT_PULLUP);
  pinMode(xlimit_pin1, INPUT_PULLUP);
  pinMode(xlimit_pin2, INPUT_PULLUP);
  Serial.begin(115200);
  initRobotSetup();
  initPosition();

  servoPen.write(roboSetup.data.penUpPos);
  delay(100);
  servoPen.attach(servopin);

  goHome();
  Serial.println("ready");
}

void loop() {
  if (Serial.available()) {
    wakeUp();

    char c = Serial.read();
    buf[bufindex++] = c;
    if (c == '\n') {
      buf[bufindex] = '\0';
      parseCmd(buf);
      memset(buf, 0, 64);
      bufindex = 0;
    }
    if(bufindex >= 64) bufindex=0;

  } else sleep();
}



// ----------------------------------------
// SERVO SLEEP

int sleep_timer = 0;
boolean isAsleep = false;

void sleep() {
  if (!isAsleep) {
    sleep_timer++;
    delay(100);
    if (sleep_timer > MS_BEFORE_SERVO_SLEEP / 100) {
      isAsleep = true;
      servoPen.detach();
      Serial.print('good night !');
    }
  }
}

void wakeUp() {
  if (isAsleep) {
    sleep_timer = 0;
    isAsleep = false;
    servoPen.attach(servopin);
  }
}




// ----------------------------------------
// ECHO

void echoPosition() {
  Serial.print("POS X");
  Serial.print(curX);
  Serial.print(" Y");
  Serial.println(curY);
}

void echoRobotSetup() {
  Serial.print("M10 XY ");
  Serial.print(roboSetup.data.width); Serial.print(' ');
  Serial.print(roboSetup.data.height); Serial.print(' ');
  Serial.print(curX); Serial.print(' ');
  Serial.print(curY); Serial.print(' ');
  Serial.print("A"); Serial.print((int)roboSetup.data.motoADir);
  Serial.print(" B"); Serial.print((int)roboSetup.data.motoBDir);
  Serial.print(" H"); Serial.print((int)roboSetup.data.motorSwitch);
  Serial.print(" S"); Serial.print((int)roboSetup.data.speed);
  Serial.print(" U"); Serial.print((int)roboSetup.data.penUpPos);
  Serial.print(" D"); Serial.println((int)roboSetup.data.penDownPos);
}

void echoEndStop() {
  Serial.print("M11 ");
  Serial.print(digitalRead(xlimit_pin1)); Serial.print(" ");
  Serial.print(digitalRead(xlimit_pin2)); Serial.print(" ");
  Serial.print(digitalRead(ylimit_pin1)); Serial.print(" ");
  Serial.println(digitalRead(ylimit_pin2));
}