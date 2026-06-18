def parseTxt(filename):
    with open(filename, 'r') as file:
        lines = file.readlines()
        data = []
        for line in lines:
            line = line.strip()
            if line:  # Skip empty lines
                data.append(line)
        return data
    
def parseCSV(filename, emojiIndex=2):
    import csv  
    with open(filename, 'r') as file:
        reader = csv.reader(file)
        data = []
        for row in reader:
            data.append(row)
        exclude_list= []
        # exclude_list= ['\U0001fac8', '\U0001facd', '\U0001faea', '\U0001fa8a', '\U0001fa8e', '\U0001f6d8']
        return [row[emojiIndex] for row in data if '\u200d' not in row[emojiIndex] and row[emojiIndex] not in exclude_list] #remove emojis that are zwj emojis and emojis that are in the exclude list
    
def parseCSV_withMetadata(filename, emojiIndex=2):
    import csv  
    with open(filename, 'r') as file:
        reader = csv.reader(file)
        data = []
        for row in reader:
            data.append(row)
        exclude_list= []
        # exclude_list= ['\U0001fac8', '\U0001facd', '\U0001faea', '\U0001fa8a', '\U0001fa8e', '\U0001f6d8']
        return [row for row in data if '\u200d' not in row[emojiIndex] and row[emojiIndex] not in exclude_list] #remove emojis that are zwj emojis and emojis that are in the exclude list


def emojiDiff(parsedData1, parsedData2):
    #return emojis in parsedData1 that are not in parsedData2, but first replace variant selectors with empty string in both lists to make them comparable  
    parsedData1 = [emoji.replace('\ufe0f', '') for emoji in parsedData1]
    parsedData2 = [emoji.replace('\ufe0f', '') for emoji in parsedData2]
    return [emoji for emoji in parsedData1 if emoji not in parsedData2] 
    
def reorderCorpus():
    #reorder the corpus.txt file to match the order of the all-categories.csv file, but only include emojis that are in the corpus.txt file
    corpus_emojis = parseTxt('../corpus.txt')
    corpus_emojis_without_variant_selectors = [emoji.replace('\ufe0f', '') for emoji in corpus_emojis]
    categories_emojis = parseCSV_withMetadata('../categorized/all-categories.csv')
    with open('../corpus_reordered.csv', 'w') as output_file:
        for row in categories_emojis:
            #this comparison should be robust to variant selectors, so we strip away variant selectors before comparing
            if row[2].replace('\ufe0f', '') in corpus_emojis_without_variant_selectors:
                #write the category, subcategory, emoji, and description to the output file, separated by commas. the emoji should be the emoji variant if the variant selector exists in either the corpus or categories version of the emoji, otherwise it should be the base emoji. we can determine this by checking if the original emoji in the corpus or categories version contains a variant selector, and if so, we use the original emoji with the variant selector, otherwise we use the base emoji without the variant selector. we can check for the presence of a variant selector by checking if '\ufe0f' is in either the corpus or categories version of the emoji. if it is, we use the original emoji with the variant selector, otherwise we use the base emoji without the variant selector.
                if '\ufe0f' in row[2] or '\ufe0f' in corpus_emojis[corpus_emojis_without_variant_selectors.index(row[2].replace('\ufe0f', ''))]:
                    output_file.write(f"{row[0]},{row[1]},{row[2] if '\ufe0f' in row[2] else corpus_emojis[corpus_emojis_without_variant_selectors.index(row[2].replace('\ufe0f', ''))]},{row[3]}\n")
                else:
                    output_file.write(f"{row[0]},{row[1]},{row[2].replace('\ufe0f', '')},{row[3]}\n")


def findDuplicates(parsedData):
    # emojis count as duplicates if they are the same emoji regardless of variant selectors, so we first create a new list of emojis with variant selectors removed, and then find duplicates in that list, and return the duplicates with their original variant selectors from the original list. we can do this by creating a mapping of the base emoji to the original emoji with variant selector, and then using that mapping to return the duplicates with their original variant selectors.
    base_emoji_to_original = {}
    for emoji in parsedData:
        base_emoji = emoji.replace('\ufe0f', '')
        if base_emoji in base_emoji_to_original:
            base_emoji_to_original[base_emoji].append(emoji)
        else:
            base_emoji_to_original[base_emoji] = [emoji]
    duplicates = []
    for base_emoji, original_emojis in base_emoji_to_original.items():
        if len(original_emojis) > 1:
            duplicates.extend(original_emojis)
    return duplicates

def nameDiff(curr_corpus_filename, proposed_corpus_filename):
    # curr_corpus_filename= "../corpus/source/emojipedia_corpus.csv"
    # proposed_corpus_filename = "../corpus/corpus.csv"

    
    #curr_corpus_filename has emoji name in index 1 of csv row
    #proposed_corpus_filename has emoji name in index 3 of csv row
    #for matching emojis (i.e. emojis in both files modulo variant selector), i want to see all instances where the names of that emoji differ across the 2 files
    #and if any emojis are unmatched (there shouldn't be) then I want to see all instances of unmatched emojis
    curr_corpus = parseCSV_withMetadata(curr_corpus_filename)
    proposed_corpus = parseCSV_withMetadata(proposed_corpus_filename,0)
    # we should strip variant selectors before comparing emojis across the 2 corpora, so we create a mapping of base emoji to name for each corpus, and then use the base emoji to find matching emojis across the 2 corpora, and then compare their names. we can also use the base emoji to find unmatched emojis across the 2 corpora.
    curr_corpus_emoji_to_name = {}
    for row in curr_corpus:
        emoji = row[2]
        name = row[3]
        base_emoji = emoji.replace('\ufe0f', '')
        curr_corpus_emoji_to_name[base_emoji] = name
        # print(f"Current -- Base Emoji: {base_emoji}, Name: {name}")
    proposed_corpus_emoji_to_name = {}
    for row in proposed_corpus:
        emoji = row[0]
        name = row[1]
        base_emoji = emoji.replace('\ufe0f', '')
        proposed_corpus_emoji_to_name[base_emoji] = name
        # print(f"Propsed -- Base Emoji: {base_emoji}, Name: {name}")
    matching_emojis = set(curr_corpus_emoji_to_name.keys()) & set(proposed_corpus_emoji_to_name.keys())
    # print(f"\nTotal matching emojis: {len(matching_emojis)}")
    # print(f"List of emojis in proposed but not curr:", set(proposed_corpus_emoji_to_name.keys()) - set(curr_corpus_emoji_to_name.keys()))
    proposed_corpus_base_emoji_order = [row[0].replace('\ufe0f', '') for row in proposed_corpus]
    matching_emojis_sorted = [emoji for emoji in proposed_corpus_base_emoji_order if emoji in matching_emojis]
    name_differences = []
    for emoji in matching_emojis_sorted:
        curr_name = curr_corpus_emoji_to_name[emoji]
        proposed_name = proposed_corpus_emoji_to_name[emoji]
        if curr_name != proposed_name:
            name_differences.append((emoji, curr_name, proposed_name))
            print(f"Emoji: {emoji} - Current Name: {curr_name}, Proposed Name: {proposed_name}")
    print(f"\nTotal matching emojis with name differences: {len(name_differences)}")
    unmatched_emojis_in_curr = set(curr_corpus_emoji_to_name.keys()) - set(proposed_corpus_emoji_to_name.keys())
    unmatched_emojis_in_proposed = set(proposed_corpus_emoji_to_name.keys()) - set(curr_corpus_emoji_to_name.keys())
    # print("\nEmojis in current corpus but not in proposed corpus:", len(unmatched_emojis_in_curr))
    # if unmatched_emojis_in_curr:
    #     for emoji in unmatched_emojis_in_curr:
    #         print(f"Emoji: {emoji} - Current Name: {curr_corpus_emoji_to_name[emoji]}")
    # print("\nEmojis in proposed corpus but not in current corpus:", len(unmatched_emojis_in_proposed))
    # if unmatched_emojis_in_proposed:
    #     for emoji in unmatched_emojis_in_proposed:
    #         print(f"Emoji: {emoji} - Proposed Name: {proposed_corpus_emoji_to_name[emoji]}")    


def variantSelectorDiff():
    #for matching emojis, see if there are any differences in the presence of variant selectors across the 2 corpora. we can do this by creating a mapping of base emoji to the original emoji with variant selector for each corpus, and then comparing the original emojis for matching base emojis across the 2 corpora. if there is a difference in the presence of variant selectors, then we print out the base emoji and the original emojis from both corpora.
    wiki_corpus_filename= "../corpus/source/wikipedia_corpus.csv"
    my_corpus_filename = "../corpus/corpus_unfiltered.csv"
    wiki_corpus = parseCSV_withMetadata(wiki_corpus_filename,0)
    my_corpus = parseCSV_withMetadata(my_corpus_filename,2)
    my_corpus_base_emoji_to_original = {}
    for row in my_corpus:
        emoji = row[2]
        base_emoji = emoji.replace('\ufe0f', '')
        my_corpus_base_emoji_to_original[base_emoji] = emoji
    wiki_corpus_base_emoji_to_original = {}
    for row in wiki_corpus:
        emoji = row[0]
        base_emoji = emoji.replace('\ufe0f', '')
        wiki_corpus_base_emoji_to_original[base_emoji] = emoji
    matching_base_emojis = set(my_corpus_base_emoji_to_original.keys()) & set(wiki_corpus_base_emoji_to_original.keys())
    variant_selector_differences = []
    for base_emoji in matching_base_emojis:
        my_emoji = my_corpus_base_emoji_to_original[base_emoji]
        wiki_emoji = wiki_corpus_base_emoji_to_original[base_emoji]
        if (my_emoji != wiki_emoji):
            variant_selector_differences.append((base_emoji, my_emoji, wiki_emoji))
            print(f"Base Emoji: {base_emoji} - My Emoji: {my_emoji}, wiki Emoji: {wiki_emoji}", "Has variant selector?", f"My: {'Yes' if '\ufe0f' in my_emoji else 'No'}, Wiki: {'Yes' if '\ufe0f' in wiki_emoji else 'No'}")
    print(f"\nTotal matching base emojis with variant selector differences: {len(variant_selector_differences)}")   

if __name__ == "__main__":
    # corpus_emojis= parseTxt('../corpus.txt')
    # categories_emojis = parseCSV('../categorized/all-categories.csv')
    # reordered_corpus_emojis = parseCSV('../corpus_reordered.csv')

    # print("Parsed Text Data:")
    # # print(corpus_emojis)
    # print(len(corpus_emojis))

    # print("Parsed Reordered Text Data:")
    # # print(reordered_corpus_emojis)
    # print(len(reordered_corpus_emojis))

    # print("Parsed CSV Data:")
    # # print(categories_emojis)
    # print(len(categories_emojis))
    
    # emojiDiff1 = emojiDiff(reordered_corpus_emojis, corpus_emojis)
    # print("Emojis in reordered csv but not in txt:")
    # print(emojiDiff1)
    # print(len(emojiDiff1))

    # emojiDiff2 = emojiDiff(categories_emojis, corpus_emojis)
    # print("Emojis in csv but not in txt:")
    # print(emojiDiff2)
    # print(len(emojiDiff2))
    
    # reorderCorpus()

    # curr_corpus= parseCSV('../corpus/source/wikipedia_corpus.csv',0)
    # proposed_corpus = parseCSV('../corpus/corpus.csv', 2)

    # print("Current Corpus Length:", len(curr_corpus))
    # print("Proposed Corpus Length:", len(proposed_corpus))

    # emojiDiff1 = emojiDiff(proposed_corpus, curr_corpus)
    # print("Emojis in proposed corpus but not in current corpus:")
    # print(emojiDiff1)
    # print(len(emojiDiff1))

    # emojiDiff2 = emojiDiff(curr_corpus, proposed_corpus)
    # print("Emojis in current corpus but not in proposed corpus:")
    # print(emojiDiff2)
    # print(len(emojiDiff2))

    # nameDiff("../corpus/corpus.csv", "../corpus/shortened_names.csv")

    variantSelectorDiff()