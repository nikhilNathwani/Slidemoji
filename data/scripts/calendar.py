import json


def emojiDiffCalendarJSONVsCorpusCSV():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # emoji_calendar.json, is a list of objects like "{"emoji": "😀", "name": "Smiling Face"}"
    json_emojis = set(item['emoji'].replace('\ufe0f', '') for item in calendar_json)

    # emoji is in index 2 of corpus.csv rows
    csv_emojis = set(row[2].replace('\ufe0f', '') for row in corpus_csv)

    only_in_json = json_emojis - csv_emojis
    only_in_csv = csv_emojis - json_emojis

    print("Emojis only in calendar.json:")
    for emoji in only_in_json:
        print(emoji)

    print("\nEmojis only in corpus.csv:")
    for emoji in only_in_csv:
        print(emoji)

    print(f"\nTotal emojis in calendar.json: {len(json_emojis)}", "unique from csv:", len(json_emojis - csv_emojis))
    print(f"Total emojis in corpus.csv: {len(csv_emojis)}", "unique from json:", len(csv_emojis - json_emojis))


def addCategoryAndSubcategoryToCalendarJSON():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a mapping from emoji to category and subcategory from corpus.csv
    emoji_to_category = {}
    for row in corpus_csv:
        emoji = row[2].replace('\ufe0f', '')
        category = row[0]
        subcategory = row[1]
        emoji_to_category[emoji] = (category, subcategory)

    # Update calendar_json with category and subcategory
    for item in calendar_json:
        emoji = item['emoji'].replace('\ufe0f', '')
        if emoji in emoji_to_category:
            category, subcategory = emoji_to_category[emoji]
            item['category'] = category
            item['subcategory'] = subcategory
        else:
            item['category'] = "Unknown"
            item['subcategory'] = "Unknown"

    # Save the updated calendar_json back to file
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(calendar_json, f, ensure_ascii=False, indent=4)



def findExcludedEmojisInCalendarJSON():
    import json
    import csv
    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)
    with open('../corpus/source/exclusion_list.csv', 'r') as f:
        reader = csv.reader(f)
        exclusion_list = []
        for row in reader:
            exclusion_list.append(row) 
    json_emojis = set(item['emoji'].replace('\ufe0f', '') for item in calendar_json)
    excluded_emojis = set(row[2].replace('\ufe0f', '') for row in exclusion_list)
    emojis_in_calendar_not_excluded = json_emojis - excluded_emojis
    emojis_excluded_not_in_calendar = excluded_emojis - json_emojis
    print("Emojis in calendar.json but not in exclusion list:")
    for emoji in emojis_in_calendar_not_excluded:
        print(emoji)
    print("\nEmojis in exclusion list but not in calendar.json:")
    for emoji in emojis_excluded_not_in_calendar:
        print(emoji)
    print(f"\nTotal emojis in calendar.json: {len(json_emojis)}", "unique from exclusion list:", len(json_emojis - excluded_emojis))
    print(f"Total emojis in exclusion list: {len(excluded_emojis)}", "unique from calendar.json:", len(excluded_emojis - json_emojis))  

def removeCalendarJSONEmojisNotInCorpusCSV():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a set of emojis from corpus.csv
    corpus_emojis = set(row[2].replace('\ufe0f', '') for row in corpus_csv)

    # Filter calendar_json to only include emojis that are in corpus_emojis
    filtered_calendar_json = [item for item in calendar_json if item['emoji'].replace('\ufe0f', '') in corpus_emojis]

    print(f"Original calendar.json had {len(calendar_json)} emojis.")
    print(f"Filtered calendar.json has {len(filtered_calendar_json)} emojis.")  
    
    # Save the filtered calendar_json back to file
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(filtered_calendar_json, f, ensure_ascii=False, indent=4)


def findCalendarAndCalendarOriginalFirstDifference():
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../emoji_calendar_ORIGINAL.json', 'r') as f:
        calendar_original_json = json.load(f)

    for i, (item1, item2) in enumerate(zip(calendar_json, calendar_original_json)):
        if item1['emoji'] != item2['emoji']:
            print(f"First difference at index {i}:")
            print(f"calendar.json emoji: {item1['emoji']}")
            print(f"calendar_ORIGINAL.json emoji: {item2['emoji']}")
            break
    else:
        print("No differences found between calendar.json and calendar_ORIGINAL.json.")


def nameDiffCalendarJSONVsCorpusCSV():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a mapping from emoji to name from calendar.json
    emoji_to_name_json = {item['emoji'].replace('\ufe0f', ''): item['name'] for item in calendar_json}

    # Create a mapping from emoji to name from corpus.csv
    emoji_to_name_csv = {row[2].replace('\ufe0f', ''): row[3] for row in corpus_csv}

    # Find emojis that are in both but have different names
    emojis_in_both = set(emoji_to_name_json.keys()) & set(emoji_to_name_csv.keys())
    for emoji in emojis_in_both:
        name_json = emoji_to_name_json[emoji]
        name_csv = emoji_to_name_csv[emoji]
        if name_json != name_csv:
            print(f"Emoji: {emoji}")
            print(f"Name in calendar.json: {name_json}")
            print(f"Name in corpus.csv: {name_csv}")
            print()

    print("Emojis with different names in calendar.json and corpus.csv:", len([emoji for emoji in emojis_in_both if emoji_to_name_json[emoji] != emoji_to_name_csv[emoji]]))
    print("Emojis with the same name in both files:", len([emoji for emoji in emojis_in_both if emoji_to_name_json[emoji] == emoji_to_name_csv[emoji]]))
    print("Emojis not in both files:", len(set(emoji_to_name_json.keys()) ^ set(emoji_to_name_csv.keys())))

def replaceCalendarJSONEmojiNamesWithCorpusCSVEmojiNames():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a mapping from emoji to name from corpus.csv
    emoji_to_name_csv = {row[2].replace('\ufe0f', ''): row[3] for row in corpus_csv}

    # Update calendar_json names with names from corpus.csv where available
    for item in calendar_json:
        emoji = item['emoji'].replace('\ufe0f', '')
        if emoji in emoji_to_name_csv:
            item['name'] = emoji_to_name_csv[emoji]

    # Save the updated calendar_json back to file
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(calendar_json, f, ensure_ascii=False, indent=4)

def rankPairsOfEmojisInCalendarJSONByMinIndexDiffBetweenEmojisOfSameSubcategory():
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    # Create a mapping from subcategory to list of emojis
    subcategory_to_emojis = {}
    for item in calendar_json:
        subcategory = item.get('subcategory', 'Unknown')
        emoji = item['emoji'].replace('\ufe0f', '')
        if subcategory not in subcategory_to_emojis:
            subcategory_to_emojis[subcategory] = []
        subcategory_to_emojis[subcategory].append(emoji)

    # Calculate the minimum index difference between pairs of emojis in the same subcategory
    min_index_diff_pairs = []
    for subcategory, emojis in subcategory_to_emojis.items():
        for i in range(len(emojis)):
            for j in range(i + 1, len(emojis)):
                emoji1 = emojis[i]
                emoji2 = emojis[j]
                index_diff = abs(calendar_json.index(next(item for item in calendar_json if item['emoji'].replace('\ufe0f', '') == emoji1)) - 
                                 calendar_json.index(next(item for item in calendar_json if item['emoji'].replace('\ufe0f', '') == emoji2)))
                min_index_diff_pairs.append((emoji1, emoji2, index_diff))

    # Sort pairs by minimum index difference
    min_index_diff_pairs.sort(key=lambda x: x[2])
    print("Min index difference between pairs of emojis in the same subcategory:", min_index_diff_pairs[0][2] if min_index_diff_pairs else "No pairs found")
    print("Pairs of emojis in the same subcategory ranked by minimum index difference:")
    for pair in min_index_diff_pairs:
        print(pair)

    return min_index_diff_pairs

# Create new calendar json, with emojis shuffled so that emojis of the same subcategory are not close to each other, and save it to a new file called emoji_calendar_shuffled.json
# The first 46 emojis should be the same as in the original calendar json, and the rest should be shuffled. The first 46 emojis are have already been used by the game in production, so we shouldn't shuffle them.
def createdShuffledCalendarJSON():
    import json
    import random

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    # Keep the first 46 emojis the same, and shuffle the rest
    first_part = calendar_json[:46]
    second_part = calendar_json[46:]

    #emojis should be shuffled so that emojis of the same subcategory are not close to each other, so we should shuffle the second part smartly
    #take into account the frequency of each subcateory, and shuffle in a way such that subcategories are distributed relative to their frequency in the second part of the calendar json
    subcategory_to_emojis = {}
    for item in second_part:
        subcategory = item.get('subcategory', 'Unknown')
        if subcategory not in subcategory_to_emojis:
            subcategory_to_emojis[subcategory] = []
        subcategory_to_emojis[subcategory].append(item) 
    # Shuffle emojis within each subcategory
    for subcategory, emojis in subcategory_to_emojis.items():
        random.shuffle(emojis)
    # Create a new list of emojis, by taking one emoji from each subcategory in a round-robin fashion, until we have all emojis in the second part
    shuffled_second_part = []
    while len(shuffled_second_part) < len(second_part):
        for subcategory, emojis in subcategory_to_emojis.items():
            if emojis:
                shuffled_second_part.append(emojis.pop(0))

    shuffled_calendar_json = first_part + shuffled_second_part

    # Save the shuffled calendar json to a new file
    with open('../emoji_calendar_shuffled.json', 'w') as f:
        json.dump(shuffled_calendar_json, f, ensure_ascii=False, indent=4)

def updateCalendarJSONWithSubcategoriesFromCorpusCSV():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a mapping from emoji to subcategory from corpus.csv
    emoji_to_subcategory_csv = {row[2].replace('\ufe0f', ''): row[1] for row in corpus_csv}

    # Update calendar_json subcategories with subcategories from corpus.csv where available
    emoji_match_count= 0
    for item in calendar_json:
        emoji = item['emoji'].replace('\ufe0f', '')
        if emoji in emoji_to_subcategory_csv:
            item['subcategory'] = emoji_to_subcategory_csv[emoji]
            emoji_match_count += 1

    print("# Unique subcategories in calendar.json after update:", len(set(item['subcategory'] for item in calendar_json)))
    print("# Emojis in calendar.json that were updated with subcategories from corpus.csv:", emoji_match_count)

    unique_subcategories = list(set(item['subcategory'] for item in calendar_json))
    unique_subcategories.sort()
    print("Unique subcategories in calendar.json after update:")
    for subcategory in unique_subcategories:
        print(subcategory)

    # Save the updated calendar_json back to file
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(calendar_json, f, ensure_ascii=False, indent=4)

def nameDiffCalendarJSONVsCorpusCSV():
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open('../corpus/corpus.csv', 'r') as f:
        reader = csv.reader(f)
        corpus_csv = []
        for row in reader:
            corpus_csv.append(row)

    # Create a mapping from emoji to name from calendar.json
    emoji_to_name_json = {item['emoji'].replace('\ufe0f', ''): item['name'] for item in calendar_json}

    # Create a mapping from emoji to name from corpus.csv
    emoji_to_name_csv = {row[2].replace('\ufe0f', ''): row[3] for row in corpus_csv}

    # Find emojis that are in both but have different names
    emojis_in_both = set(emoji_to_name_json.keys()) & set(emoji_to_name_csv.keys())
    name_mismatches= 0
    print(f"# emojis in both: {len(emojis_in_both)}")
    for emoji in emojis_in_both:
        name_json = emoji_to_name_json[emoji]
        name_csv = emoji_to_name_csv[emoji]
        if name_json != name_csv:
            name_mismatches += 1
            print(f"Emoji: {emoji}")
            print(f"Name in calendar.json: {name_json}")
            print(f"Name in corpus.csv: {name_csv}")
    print(f"# name mismatches: {name_mismatches}")

def categoryDistributionInCalendarJSON():
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    category_to_count = {}
    for item in calendar_json:
        category = item.get('category', 'Unknown')
        if category not in category_to_count:
            category_to_count[category] = 0
        category_to_count[category] += 1

    print("Category distribution in calendar.json (sorted descending):")
    for category, count in sorted(category_to_count.items(), key=lambda x: x[1], reverse=True):
        print(f"{category}: {count}")

def subcategoryDistributionInCalendarJSON():
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    subcategory_to_category= {}
    subcategory_to_count = {}
    for item in calendar_json:
        subcategory = item.get('subcategory', 'Unknown')
        category = item.get('category', 'Unknown')
        subcategory_to_category[subcategory] = category
        if subcategory not in subcategory_to_count:
            subcategory_to_count[subcategory] = 0
        subcategory_to_count[subcategory] += 1

    print("Subcategory distribution in calendar.json (sorted descending):")
    for subcategory, count in sorted(subcategory_to_count.items(), key=lambda x: x[1], reverse=True):
        print(f"{subcategory_to_category.get(subcategory, 'Unknown')} > {subcategory}: {count}")

    print("Total unique subcategories:", len(subcategory_to_count))


def updateEmojiCalendarToUseOrderingFromEvenlyDistributedSubcategorySequenceCSV(subcategory_sequence_filename='../evenly_distributed_subcategories_with_emojis.csv'):
    import json
    import csv

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    with open(subcategory_sequence_filename, 'r') as f:
        reader = csv.reader(f)
        subcategory_sequence = []
        for row in reader:
            subcategory_sequence.append(row)

    # Create a mapping from emoji to calendar item
    emoji_to_calendar_item = {item['emoji'].replace('\ufe0f', ''): item for item in calendar_json}

    # Create a new calendar json based on the ordering in the subcategory sequence csv
    new_calendar_json = []
    for row in subcategory_sequence:
        emoji = row[2].replace('\ufe0f', '')
        if emoji in emoji_to_calendar_item:
            new_calendar_json.append(emoji_to_calendar_item[emoji])
            new_calendar_json[-1]['emoji'] = row[2]  # Update the emoji to the version in the subcategory sequence csv (which may have a variation selector)
        else:
            print(f"Emoji {emoji} from subcategory sequence csv not found in calendar json")

    print(f"Original calendar.json had {len(calendar_json)} emojis.")
    print(f"New calendar.json has {len(new_calendar_json)} emojis.")

    # Save the new calendar json back to file
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(new_calendar_json, f, ensure_ascii=False, indent=4)

def useWikiCorpusVersionOfEmojiInEmojiCalendarJSON():
    import csv
    import json

    with open('../corpus/source/wikipedia_corpus.csv', 'r') as f:
        reader = csv.reader(f)
        wiki_csv = []
        for row in reader:
            wiki_csv.append(row)
    wiki_base_emoji_to_emoji = {row[0].replace('\ufe0f', ''): row[0] for row in wiki_csv}
    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)
    for item in calendar_json:
        emoji = item['emoji'].replace('\ufe0f', '')
        if emoji in wiki_base_emoji_to_emoji:
            if item['emoji'] != wiki_base_emoji_to_emoji[emoji]:
                print(f"Updating emoji {item['emoji']} to wiki version {wiki_base_emoji_to_emoji[emoji]} in calendar.json"  )
                item['emoji'] = wiki_base_emoji_to_emoji[emoji]
    with open('../emoji_calendar.json', 'w') as f:
        json.dump(calendar_json, f, ensure_ascii=False, indent=4)


if __name__ == "__main__":
    # nameDiffCalendarJSONVsCorpusCSV()
    # replaceCalendarJSONEmojiNamesWithCorpusCSVEmojiNames()
    useWikiCorpusVersionOfEmojiInEmojiCalendarJSON()
