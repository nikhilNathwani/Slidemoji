**Emoji Sources:**
-  source/unicode_corpus.csv is derived from the Unicode source: https://www.unicode.org/Public/17.0.0/emoji/emoji-test.txt. Modifications:
    -  converted to csv format
    -  filtered to fully-qualified emojis only (i.e. those that have the "fully-qualified" tag in the original unicode_corpus_raw.txt file), since those are the ones that are most likely to render properly across platforms. Excludes unqualified and minimally-qualified and component emojis, which are more likely to render as plain text characters or not at all on some platforms.
        -  note some of these are still missing the variant selector where emojipedia had it, so in those cases I chose the version WITH variant selector, to maximize chances of proper rendering across platforms.
    -  extraneous metadata removed (codepoints, fully-qualified, version) 
    -  ZWJ emojis removed (i.e. emojis that are made up of multiple unicode characters joined together with the unicode string '\u200d'**), since they render inconsistently across platforms. Can consider adding them back in a future iteration if needed.
-  source/emojipedia_corpus.csv contains all emojis with their listed categories & subcategories, sourced from Emojipedia: https://emojipedia.org/ (flags excluded since they are ZWJs which get excluded by unicode corpus anyway)
-  source/wikipedia_corpus.csv contains all emojis from the emoji table in the wikipedia page https://en.wikipedia.org/wiki/List_of_emojis. This lacks categories & subcategories.
-  source/exclusion_list.csv contains emojis to exclude from the game, based on various factors such as rendering issues across platforms, or otherwise not being suitable for the game.

**What Each Source is Used For:**
-  unicode_corpus hones in on the exact set of emojis I want (filter out all ZWJs, and all unqualified/minimally-qualified/component emojis). Also provides categories/subcategories names. 
-  emojipedia_corpus provides well-formated names for the emojis (e.g.  "Bowl with Spoon" instead of "bowl with spoon")
-  wikipedia_corpus provides variant-selector versions wherever possible (this ensures we show emoji depictions rather than base plaintext-style characters)
-  Note: I manually update some subcategories to ensure similar emojis aren't too close together in the calendar (e.g. "face-smiling" amd "face-affection" are both now "face")

**What Gets Used in the Game:**
-  corpus.csv joins the source corpora minus the emojis in source/exclusion_list.csv
    - THIS is the source-of-truth corpus for the game. 
    - I.e. this list gets shuffled to determine the emoji_calendar.json ordering.
    - Wherever a variant selector is available, the emoji variant (not the base variant) is used, since that will render best (as opposed to a wingdings-like plain text character which would look odd/broken in the game grid).
        -  The variant is produced by adding the unicode character '\ufe0f' after the base emoji. For example, the base emoji for "grinning face" is "😀" (unicode U+1F600), and the variant emoji is "😀️" (unicode U+1F600 U+FE0F). The variant selector ensures that the emoji renders as a colorful image rather than a plain text character.
    - Note: the the following emojis sometimes showed up as unicode strings in terminal, so should test them in the game to ensure they render as proper emojis: and other misc. emojis that are at risk of not rendering properly across platforms (e.g. because they showed up as unicode strings when printed in terminal: 🫪 '\U0001fac8', 🫈 '\U0001facd', 🪊 '\U0001faea', 🛘 '\U0001f6d8', 🪎 '\U0001fa8e', 🫍 '\U0001fa8a',🫯,🛝,🧵,🧊).
-  emoji_calendar.json is a copy of the puzzle document (NoSQL table) in Firestore. This is what powers the game, i.e. it determines the order in which emojis are shown in the game. 
    -  Despite being a copy of the source-of-truth, it is still used in the app code and should be updated with any changes to the source-of-truth.