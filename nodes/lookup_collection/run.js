
var mapping = context.mapping;
var local_key_value = context.doc[context.node.settings.in_key_field];
out.setter = {};
var fuzzy = 1.0;

if(Array.isArray(local_key_value)) {
	out.setter[context.node.params.out_field] = [];
	out.setter[context.node.params.out_score] = [];
	
	local_key_value.forEach(function(val, index) {
		if(typeof val === "string")
			val = val.trim();
			
		var mapped = map(val);
		
		out.setter[context.node.params.out_field].push(mapped.value);
		out.setter[context.node.params.out_score].push(mapped.score.toString());

	})
} else if(typeof local_key_value === "string") {
	var mapped = map(local_key_value);
	out.setter[context.node.params.out_field] = mapped.value;
	out.setter[context.node.params.out_score] = mapped.score.toString();
}


if(parseInt(context.count) % 100 == 0) 
    out.say("progress", context.node.type.toUpperCase() + ": processed " + context.count + "/" + context.doc_count);


// TODO: should take the best match

// we expect that mapping data has string value or arrays with length 1 
function map(key_value) {
	var mapped = {};
	mapped.value = "";
	mapped.score = 0.0;

	for(var i = 0; i < mapping.length; i++) {
		var lookup_key_value = mapping[i][context.node.settings.lookup_key_field];
		var lookup_copy_value = mapping[i][context.node.settings.lookup_copy_field];
		if(Array.isArray(lookup_key_value)) {
			lookup_key_value = lookup_key_value[0];
		}
		
		if(Array.isArray(lookup_copy_value)) {
			lookup_copy_value = lookup_copy_value[0];
		}
		
		if(typeof lookup_key_value === "string")
			lookup_key_value = lookup_key_value.trim();
		
		var score = stringScore(key_value, lookup_key_value, fuzzy);
		
		// keep records of highest score
		if(score > mapped.score) {
			mapped.score = score;
			mapped.value = lookup_copy_value;
		} 
	}
//out.console.log(mapped.score)
//out.console.log(parseFloat(context.node.settings.fuzzy_level))
//out.console.log(mapped.score >= parseFloat(context.node.settings.fuzzy_level));
//out.console.log(mapped)


	var fuzzy = mapped.score >= parseFloat(context.node.settings.fuzzy_level);
	if(fuzzy) {
		return mapped;
	} 
	
	// if no matches, then return original key
	if((mapped.score === 0.0 || !fuzzy) && context.node.settings.copy === "true")
		mapped.value = key_value;
	else
		mapped.value = "";
		
	return mapped;
}


/*!
 * string_score.js: String Scoring Algorithm 0.1.22
 *
 * http://joshaven.com/string_score
 * https://github.com/joshaven/string_score
 *
 * Free to use, modify, etc... see attached license for more info
 * Copyright (C) 2009-2015 Joshaven Potter <yourtech@gmail.com>
 * MIT License: http://opensource.org/licenses/MIT
 * Special thanks to all of the contributors listed here https://github.com/joshaven/string_score
 *
 * Updated: Tue Mar 10 2015
*/

/*jslint nomen:true, white:true, browser:true,devel:true */

/**
 * Scores a string against another string.
 *    'Hello World'.score('he');         //=> 0.5931818181818181
 *    'Hello World'.score('Hello');    //=> 0.7318181818181818
 */
 
 /**
  * changes by AH: transformed to a function
  * */
function stringScore (word_o, word, fuzziness) {
	'use strict';
	word = word.replace("\n","");
	word_o = word_o.replace("\n","");

  // If the string is equal to the word, perfect match.
  if (word === word_o) { return 1; }

  //if it's not a perfect match and is empty return 0
  //if (word === "") { return 0; }

  var runningScore = 0,
      charScore,
      finalScore,
      string = word_o,
      lString = string.toLowerCase(),
      strLength = string.length,
      lWord = word.toLowerCase(),
      wordLength = word.length,
      idxOf,
      startAt = 0,
      fuzzies = 1,
      fuzzyFactor,
      i;

  // Cache fuzzyFactor for speed increase
  if (fuzziness) { fuzzyFactor = 1 - fuzziness; }

  // Walk through word and add up scores.
  // Code duplication occurs to prevent checking fuzziness inside for loop
  if (fuzziness) {
    for (i = 0; i < wordLength; i+=1) {

      // Find next first case-insensitive match of a character.
      idxOf = lString.indexOf(lWord[i], startAt);

      if (idxOf === -1) {
        fuzzies += fuzzyFactor;
      } else {
        if (startAt === idxOf) {
          // Consecutive letter & start-of-string Bonus
          charScore = 0.7;
        } else {
          charScore = 0.1;

          // Acronym Bonus
          // Weighing Logic: Typing the first character of an acronym is as if you
          // preceded it with two perfect character matches.
          if (string[idxOf - 1] === ' ') { charScore += 0.8; }
        }

        // Same case bonus.
        if (string[idxOf] === word[i]) { charScore += 0.1; }

        // Update scores and startAt position for next round of indexOf
        runningScore += charScore;
        startAt = idxOf + 1;
      }
    }
  } else {
    for (i = 0; i < wordLength; i+=1) {
      idxOf = lString.indexOf(lWord[i], startAt);
      if (-1 === idxOf) { return 0; }

      if (startAt === idxOf) {
        charScore = 0.7;
      } else {
        charScore = 0.1;
        if (string[idxOf - 1] === ' ') { charScore += 0.8; }
      }
      if (string[idxOf] === word[i]) { charScore += 0.1; }
      runningScore += charScore;
      startAt = idxOf + 1;
    }
  }

  // Reduce penalty for longer strings.
  finalScore = 0.5 * (runningScore / strLength    + runningScore / wordLength) / fuzzies;

  if ((lWord[0] === lString[0]) && (finalScore < 0.85)) {
    finalScore += 0.15;
  }

  return finalScore;
};

