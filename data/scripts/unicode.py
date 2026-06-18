#convert ../corpus/source/unicode_corpus.txt to a csv
#each row should be [category], [subcategory], [emoji], [name]
#the file is formatted like this:
#
# # group: Smileys & Emotion

# # subgroup: face-smiling
# 1F600                                                  ; fully-qualified     # 😀 E1.0 grinning face
# 1F603                                                  ; fully-qualified     # 😃 E0.6 grinning face with big eyes
# 1F604                                                  ; fully-qualified     # 😄 E0.6 grinning face with smiling eyes
# 1F601                                                  ; fully-qualified     # 😁 E0.6 beaming face with smiling eyes
# 1F606                                                  ; fully-qualified     # 😆 E0.6 grinning squinting face
# 1F605                                                  ; fully-qualified     # 😅 E0.6 grinning face with sweat
# 1F923                                                  ; fully-qualified     # 🤣 E3.0 rolling on the floor laughing
# 1F602                                                  ; fully-qualified     # 😂 E0.6 face with tears of joy
# 1F642                                                  ; fully-qualified     # 🙂 E1.0 slightly smiling face
# 1F643                                                  ; fully-qualified     # 🙃 E1.0 upside-down face
# 1FAE0                                                  ; fully-qualified     # 🫠 E14.0 melting face
# 1F609                                                  ; fully-qualified     # 😉 E0.6 winking face
# 1F60A                                                  ; fully-qualified     # 😊 E0.6 smiling face with smiling eyes
# 1F607                                                  ; fully-qualified     # 😇 E1.0 smiling face with halo

# # subgroup: face-affection
# 1F970                                                  ; fully-qualified     # 🥰 E11.0 smiling face with hearts
# 1F60D                                                  ; fully-qualified     # 😍 E0.6 smiling face with heart-eyes
# 1F929   
#
# i.e. a Group starts with "# group: ", a subgroup starts with "# subgroup: ", and the emoji rows start with the unicode codepoint, followed by " ; fully-qualified     # ", followed by the emoji, followed by the name and version information.
# we don't need to keep the "fully-qualified" information or the version information. 
from parse import parseCSV_withMetadata


def convertToCSV():
    with open("../corpus/source/unicode_corpus.txt", "r") as f:
        lines = f.readlines()
    
    category = ""
    subcategory = ""
    rows = []
    for line in lines:
        line = line.strip()
        if line.startswith("# group: "):
            category = line[len("# group: "):]
        elif line.startswith("# subgroup: "):
            subcategory = line[len("# subgroup: "):]
        # we do not want to keep ZWJ emojis. So we need to look at the codepoints and only keep emojis with only one codepoint that isnt FE0F. i.e. only emojis with one codepoint, or one codepoint plus FE0F. 
        #names are like this: "E15.0 leftwards pushing hand" i.e. "[version] [name]", we want to remove the version information and just keep the name.
        elif line and not line.startswith("#"):
            parts = line.split(";")
            codepoints = parts[0].strip().split(" ")
            if len(codepoints) == 1 or (len(codepoints) == 2 and "FE0F" in codepoints):
                emoji_part = parts[1].split("#")[1].strip()
                emoji = emoji_part.split(" ")[0]
                name = " ".join(emoji_part.split(" ")[1:])[4:]
                # for now, include the codepoints as the first value in the csv rows, so i can manually verify we are filtering properly
                rows.append([" ".join(codepoints), category, subcategory, emoji, name])
    
    with open("../corpus/source/unicode_corpus.csv", "w") as f:
        for row in rows:
            f.write(",".join(row) + "\n")

#compare the emojis in unicode corpus with the emojis in the emojipedia corpus
def emojiDiffWithEmojipediaCorpus():
    def parseUnicodeCorpus():  
        unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
        unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 3)
        return unicode_corpus
    def parseEmojipediaCorpus():
        emojipedia_corpus_filename = "../corpus/corpus_unfiltered.csv"
        emojipedia_corpus = parseCSV_withMetadata(emojipedia_corpus_filename, 2)
        return emojipedia_corpus
    unicode_corpus = parseUnicodeCorpus()
    emojipedia_corpus = parseEmojipediaCorpus()
    # strip away variant selectors before comparing
    unicode_emojis = set([row[3].replace('\uFE0F', '') for row in unicode_corpus])
    emojipedia_emojis = set([row[2].replace('\uFE0F', '') for row in emojipedia_corpus])
    only_in_unicode = unicode_emojis - emojipedia_emojis
    only_in_emojipedia = emojipedia_emojis - unicode_emojis
    print(f"Emojis only in unicode corpus: {only_in_unicode}")
    print(f"Emojis only in emojipedia corpus: {only_in_emojipedia}")
    print(f"Total emojis in unicode corpus: {len(unicode_emojis)}, Total unique: {len(only_in_unicode)}")
    print(f"Total emojis in emojipedia corpus: {len(emojipedia_emojis)}, Total unique: {len(only_in_emojipedia)}")
    
def emojiDiffWithWikipediaCorpus():
    def parseUnicodeCorpus():  
        unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
        unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 3)
        return unicode_corpus
    def parseWikipediaCorpus():
        wikipedia_corpus_filename = "../corpus/source/wikipedia_corpus.csv"
        wikipedia_corpus = parseCSV_withMetadata(wikipedia_corpus_filename, 0)
        return wikipedia_corpus
    unicode_corpus = parseUnicodeCorpus()
    wikipedia_corpus = parseWikipediaCorpus()
    # strip away variant selectors before comparing
    unicode_emojis = set([row[3].replace('\uFE0F', '') for row in unicode_corpus])
    wikipedia_emojis = set([row[0].replace('\uFE0F', '') for row in wikipedia_corpus])
    only_in_unicode = unicode_emojis - wikipedia_emojis
    only_in_wikipedia = wikipedia_emojis - unicode_emojis
    print(f"Emojis only in unicode corpus: {only_in_unicode}")
    print(f"Emojis only in wikipedia corpus: {only_in_wikipedia}")
    print(f"Total emojis in unicode corpus: {len(unicode_emojis)}, Total unique: {len(only_in_unicode)}")
    print(f"Total emojis in wikipedia corpus: {len(wikipedia_emojis)}, Total unique: {len(only_in_wikipedia)}")
       

def emojiDiffWithJoinedCorpus():
    def parseUnicodeCorpus():  
        unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
        unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 2)
        return unicode_corpus
    def parseJoinedCorpus():
        joined_corpus_filename = "../corpus/corpus.csv"
        joined_corpus = parseCSV_withMetadata(joined_corpus_filename, 2)
        return joined_corpus
    unicode_corpus = parseUnicodeCorpus()
    joined_corpus = parseJoinedCorpus()
    # strip away variant selectors before comparing
    unicode_emojis = set([row[2].replace('\uFE0F', '') for row in unicode_corpus])
    joined_emojis = set([row[2].replace('\uFE0F', '') for row in joined_corpus])
    only_in_unicode = unicode_emojis - joined_emojis
    only_in_joined = joined_emojis - unicode_emojis
    return only_in_unicode
    print(f"Emojis only in unicode corpus: {only_in_unicode}")
    print(f"Emojis only in joined corpus: {only_in_joined}")
    print(f"Total emojis in unicode corpus: {len(unicode_emojis)}, Total unique: {len(only_in_unicode)}")
    print(f"Total emojis in joined corpus: {len(joined_emojis)}, Total unique: {len(only_in_joined)}")
       

def variantDiffUnicodeVsCorpus():
    def parseUnicodeCorpus():  
        unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
        unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 3)
        return unicode_corpus
    def parseJoinedCorpus():
        joined_corpus_filename = "../corpus/corpus.csv"
        joined_corpus = parseCSV_withMetadata(joined_corpus_filename, 2)
        return joined_corpus
    unicode_corpus = parseUnicodeCorpus()
    joined_corpus = parseJoinedCorpus()
    unicode_emoji_to_variant_selector_presence = {row[3]: '\uFE0F' in row[3] for row in unicode_corpus}
    joined_emoji_to_variant_selector_presence = {row[2]: '\uFE0F' in row[2] for row in joined_corpus}
    emojis_in_both = set(unicode_emoji_to_variant_selector_presence.keys()) & set(joined_emoji_to_variant_selector_presence.keys())
    differences = []
    for emoji in emojis_in_both:
        unicode_has_variant_selector = unicode_emoji_to_variant_selector_presence[emoji]
        joined_has_variant_selector = joined_emoji_to_variant_selector_presence[emoji]
        if unicode_has_variant_selector != joined_has_variant_selector:
            differences.append((emoji, unicode_has_variant_selector, joined_has_variant_selector))
            print(f"Emoji: {emoji} - Unicode has variant selector? {'Yes' if unicode_has_variant_selector else 'No'}, Joined corpus has variant selector? {'Yes' if joined_has_variant_selector else 'No'}")
    print(f"\nTotal emojis with variant selector differences: {len(differences)}")     



def variantDiffEmojipediaVsWikipedia():
    def parseEmojipediaCorpus():  
        emojipedia_corpus_filename = "../corpus/source/emojipedia_corpus.csv"
        emojipedia_corpus = parseCSV_withMetadata(emojipedia_corpus_filename, 2)
        return emojipedia_corpus
    def parseWikipediaCorpus():
        wikipedia_corpus_filename = "../corpus/source/wikipedia_corpus.csv"
        wikipedia_corpus = parseCSV_withMetadata(wikipedia_corpus_filename, 0)
        return wikipedia_corpus
    emojipedia_corpus = parseEmojipediaCorpus()
    wikipedia_corpus = parseWikipediaCorpus()
    emojipedia_emoji_to_variant_selector_presence = {row[2]: '\uFE0F' in row[2] for row in emojipedia_corpus}
    wikipedia_emoji_to_variant_selector_presence = {row[0]: '\uFE0F' in row[0] for row in wikipedia_corpus}
    print(f"Total emojis in emojipedia corpus: {len(emojipedia_emoji_to_variant_selector_presence)}, with variant selector: {sum(emojipedia_emoji_to_variant_selector_presence.values())}")
    print(f"Total emojis in wikipedia corpus: {len(wikipedia_emoji_to_variant_selector_presence)}, with variant selector: {sum(wikipedia_emoji_to_variant_selector_presence.values())}")
    print(f"Total emojis in both corpora: {len(set(emojipedia_emoji_to_variant_selector_presence.keys()) & set(wikipedia_emoji_to_variant_selector_presence.keys()))}")
    print(f"Total emojis with variant selector in emojipedia: {len([emoji for emoji, has_variant in emojipedia_emoji_to_variant_selector_presence.items() if has_variant])}")
    print(f"Total emojis with variant selector in wikipedia corpus: {len([emoji for emoji, has_variant in wikipedia_emoji_to_variant_selector_presence.items() if has_variant])}")  
    emojis_in_both = set(emojipedia_emoji_to_variant_selector_presence.keys()) & set(wikipedia_emoji_to_variant_selector_presence.keys())
    emojis_in_wiki_only = set(wikipedia_emoji_to_variant_selector_presence.keys()) - set(emojipedia_emoji_to_variant_selector_presence.keys())
    emojis_in_emojipedia_only = set(emojipedia_emoji_to_variant_selector_presence.keys()) - set(wikipedia_emoji_to_variant_selector_presence.keys())
    print(f"Emojis only in wikipedia corpus: {len(emojis_in_wiki_only)}, with variant selector: {sum(wikipedia_emoji_to_variant_selector_presence[emoji] for emoji in emojis_in_wiki_only)}", "they are:", emojis_in_wiki_only)
    print(f"Emojis only in emojipedia corpus: {len(emojis_in_emojipedia_only)}, with variant selector: {sum(emojipedia_emoji_to_variant_selector_presence[emoji] for emoji in emojis_in_emojipedia_only)}", "they are:", emojis_in_emojipedia_only)
    differences = []
    for emoji in emojis_in_both:
        emojipedia_has_variant_selector = emojipedia_emoji_to_variant_selector_presence[emoji]
        wikipedia_has_variant_selector = wikipedia_emoji_to_variant_selector_presence[emoji]
        if emojipedia_has_variant_selector and wikipedia_has_variant_selector:
            print(f"Emoji: {emoji} - Both corpora have variant selector")
        if emojipedia_has_variant_selector != wikipedia_has_variant_selector:
            differences.append((emoji, emojipedia_has_variant_selector, wikipedia_has_variant_selector))
            print(f"Emoji: {emoji} - emojipedia has variant selector? {'Yes' if emojipedia_has_variant_selector else 'No'}, wikipedia corpus has variant selector? {'Yes' if wikipedia_has_variant_selector else 'No'}")
    print(f"\nTotal emojis with variant selector differences: {len(differences)}")     



def replaceCorpusSubcategoriesWithUnicodeCorpusSubcategories():
    unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
    unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 3)
    emoji_to_subcategory = {row[2].replace("\ufe0f", ""): row[1] for row in unicode_corpus}
    joined_corpus_filename = "../corpus/corpus.csv"
    joined_corpus = parseCSV_withMetadata(joined_corpus_filename, 2)
    new_rows = []
    unknown_count= 0
    for row in joined_corpus:
        emoji = row[2].replace("\ufe0f", "")
        subcategory = emoji_to_subcategory.get(emoji, "Unknown")
        if subcategory == "Unknown":
            print(f"Unknown emoji: {emoji}")
            unknown_count += 1
        new_row = [row[0], subcategory, row[2], row[3]]
        new_rows.append(new_row)
    print("total unknown", unknown_count)
    with open("../corpus/corpus_with_unicode_subcategories.csv", "w") as f:
        for row in new_rows:
            f.write(",".join(row) + "\n")

def removeCodepointsFromCSV():
    unicode_corpus_filename = "../corpus/source/unicode_corpus.csv"
    unicode_corpus = parseCSV_withMetadata(unicode_corpus_filename, 3)
    new_rows = []
    for row in unicode_corpus:
        new_row = [row[1], row[2], row[3], row[4]]
        new_rows.append(new_row)
    with open("../corpus/source/unicode_corpus_no_codepoints.csv", "w") as f:
        for row in new_rows:
            f.write(",".join(row) + "\n")

def emojiDiffWithExclusionList(emoji_set):
    #exclusion list is a csv, emoji is in index 2
    def parseExclusionList():
        exclusion_list_filename = "../corpus/source/exclusion_list.csv"
        exclusion_list = parseCSV_withMetadata(exclusion_list_filename, 2)
        return set([row[2].replace('\uFE0F', '') for row in exclusion_list])
    exclusion_list = parseExclusionList()
    #compare to emoji_set which is a set of emojis
    only_in_emoji_set = emoji_set - exclusion_list
    only_in_exclusion_list = exclusion_list - emoji_set
    print(f"Emojis only in emoji set: {only_in_emoji_set}")
    print(f"Emojis only in exclusion list: {only_in_exclusion_list}")
    print(f"Total emojis in emoji set: {len(emoji_set)}, Total unique: {len(only_in_emoji_set)}")
    print(f"Total emojis in exclusion list: {len(exclusion_list)}, Total unique: {len(only_in_exclusion_list)}")

if __name__ == "__main__":
    replaceCorpusSubcategoriesWithUnicodeCorpusSubcategories()