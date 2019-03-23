
import * as fs from 'fs';
import test from 'ava';
import * as YAML from 'js-yaml';
import * as _ from 'lodash';

import * as imageSize from 'image-size';

import { validateMeta } from './validate-meta';

import { Character } from '../app/models/character';

const ROOT_FILE = 'src/assets/data/root.yml';

test('All characters have valid information', t => {
  const data = fs.readFileSync(ROOT_FILE, 'utf-8');
  const { classes, weapons } = YAML.safeLoad(data);

  const weaponHash = weapons.reduce((prev, cur) => {
    prev[cur.id] = true;
    return prev;
  }, {});

  const characterNames = {};

  classes.forEach(charClass => {
    const datagl = fs.readFileSync(`src/assets/data/character/${charClass.toLowerCase()}.yml`, 'utf-8');
    const charactersgl: Character[] = YAML.safeLoad(datagl);

    const datajp = fs.readFileSync(`src/assets/data/character/${charClass.toLowerCase()}.jp.yml`, 'utf-8');
    const charactersjp: Character[] = YAML.safeLoad(datajp);

    const characters = charactersgl.concat(charactersjp);

    characters.forEach(char => {
      const parenName = ` (${char.name}) [${char.cat}]`;

      t.truthy(char.name, 'name');
      t.falsy(characterNames[parenName], 'name is not duplicated by any other character' + parenName);

      characterNames[parenName] = true;

      t.falsy(char.type, 'type should not be set' + parenName);
      t.true(char.cat === 'jp' || char.cat === 'gl', 'cat must be jp or gl' + parenName);
      t.true(char.rating >= 0 && char.rating <= 10, 'rating must be between 0 and 10' + parenName);
      t.truthy(char.picture, 'must have a picture url' + parenName);
      t.truthy(weaponHash[char.weapon], `char must have a valid weapon type (${char.weapon} is invalid)` + parenName);
      t.true(char.star >= 3 && char.star <= 5, 'star level must be between 3 and 5' + parenName);
      t.true(_.isNumber(char.stats.atk), 'stats.atk must be a number' + parenName);
      t.true(_.isNumber(char.stats.int), 'stats.int must be a number' + parenName);
      t.true(_.isNumber(char.stats.def), 'stats.def must be a number' + parenName);
      t.true(_.isNumber(char.stats.hit), 'stats.hit must be a number' + parenName);
      t.true(_.isNumber(char.stats.grd), 'stats.grd must be a number' + parenName);
      t.true(_.isNumber(char.stats.hp), 'stats.hp must be a number' + parenName);

      t.true(fs.existsSync(`src/assets/characters/${char.picture}.png`), 'character must reference a valid image' + parenName);

      if(char.awakened) {
        t.true(char.awakened === true || char.awakened === 9, 'awakened must be either true or 9');
        t.true(char.name.includes('(Awakened)'), 'name should include (Awakened)' + parenName);
      }

      const charPicInfo = imageSize(`src/assets/characters/${char.picture}.png`);
      t.is(charPicInfo.type, 'png', 'char image must be a png' + parenName);

      char.talents.forEach(talent => {
        t.truthy(talent.name, 'talents must have a name' + parenName);

        talent.effects.forEach(eff => {
          t.truthy(eff.desc, 'talent.effect must have a desc' + parenName);
          if(eff.duration) {
            t.true(_.isNumber(eff.duration), 'talent.effect.duration must be a number' + parenName);
          }

          validateMeta(t, eff.meta, parenName);
        });
      });

      char.skills.forEach(skill => {
        t.truthy(skill.name, 'skill.name must exist' + parenName);
        if(skill.maxHits) { t.truthy(skill.power, 'skill.power must exist if it skill.maxHits exists' + parenName); }
        t.truthy(skill.ap, 'skill.ap must exist' + parenName);
        
        if(skill.element) {
          t.true(_.includes(['Dark', 'Earth', 'Fire', 'Ice', 'Light', 'Lightning', 'Wind'], skill.element), 'skill element must be a valid element' + parenName);
        }

        t.true(fs.existsSync(`src/assets/skills/${skill.picture}.png`), 'skill ' + skill.name + ' must reference a valid image' + parenName);

        const skillPicInfo = imageSize(`src/assets/skills/${skill.picture}.png`);
        t.is(skillPicInfo.type, 'png', 'skill ' + skill.name +  ' image must be a png' + parenName);

        validateMeta(t, skill.meta, parenName);
      });

      t.truthy(char.rush.name, 'rush.name must exist' + parenName);
      t.truthy(char.rush.power, 'rush.power must exist' + parenName);
      t.truthy(char.rush.maxHits, 'rush.maxHits must exist' + parenName);
      t.true(fs.existsSync(`src/assets/rush/${char.rush.picture}.png`), 'rush ' + char.rush.name + ' must reference a valid image' + parenName);

        
      if(char.rush.element) {
        t.true(_.includes(['Dark', 'Earth', 'Fire', 'Ice', 'Light', 'Lightning', 'Wind'], char.rush.element), 'rush element must be a valid element' + parenName);
      }
      
      const rushPicInfo = imageSize(`src/assets/rush/${char.rush.picture}.png`);
      t.is(rushPicInfo.type, 'png', 'rush ' + char.rush.name +  ' image must be a png' + parenName);

      if(char.rush.effects && char.rush.effects.length > 0) {
        char.rush.effects.forEach(eff => {
          validateMeta(t, eff.meta, parenName);
        });
      }
    });
  });
});
