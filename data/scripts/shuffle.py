# 
#  Generate a sequence of subcategories whose length equals the total number
#  of emojis in the dataset.
#  
#  Input:
#  - Array of emoji objects containing at least:
#    { category, subcategory }
#  
#  Goal:
#  - Produce an array of subcategory names, one entry per emoji.
#  - The number of occurrences of each subcategory in the output must exactly
#    match the number of emojis belonging to that subcategory.
#  
#  Distribution requirements:
#  - This is NOT a random shuffle.
#  - Subcategories should be spread as evenly as possible across the entire
#    sequence.
#  - Large subcategories should appear approximately every
#    totalCount / subcategoryCount positions.
#  - Use a randomized starting offset for each subcategory so the result is
#    different each run.
#  - Avoid clustering occurrences of the same subcategory.
#  
#  Suggested approach:
#  - Count occurrences of every subcategory in emoji_calendar.json.
#  - For each subcategory:
#      idealGap = totalEmojiCount / subcategoryCount
#      randomOffset = random value in [0, idealGap)
#  - Generate ideal target positions for every occurrence of every
#    subcategory using:
#      offset + occurrenceIndex * idealGap
#  - Combine all generated positions into a single list.
#  - Sort by target position.
#  - Output the ordered list of subcategories.
#  
def generateEvenlyDistributedSubcategorySequence(fixed_emoji_end_num=47):
    import json
    import random
    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    fixed_subcategories = [item.get('subcategory', 'Unknown') for item in calendar_json[:fixed_emoji_end_num]]
    subcategory_counts = {}
    for item in calendar_json:
        subcategory = item.get('subcategory', 'Unknown')
        subcategory_counts[subcategory] = subcategory_counts.get(subcategory, 0) + 1
    for subcategory in fixed_subcategories:
        subcategory_counts[subcategory] -= 1
    total_emoji_count = sum(subcategory_counts.values())
    subcategory_positions = []
    for subcategory, count in subcategory_counts.items():
        if count > 0:
            ideal_gap = total_emoji_count / count
            random_offset = random.uniform(0, ideal_gap)
            for i in range(count):
                position = random_offset + i * ideal_gap
                subcategory_positions.append((position, subcategory))
    subcategory_positions.sort(key=lambda x: x[0])
    output_subcategories = fixed_subcategories + [subcategory for _, subcategory in subcategory_positions]
    with open('../evenly_distributed_subcategories.csv', 'w') as f:
        for subcategory in output_subcategories:
             f.write(f"{subcategory}\n")

# /**
#  * Analyze the generated subcategory schedule in '../evenly_distributed_subcategories.txt'.
#  *
#  * For each subcategory appearing more than once:
#  * - count
#  * - ideal gap
#  * - min gap
#  * - avg gap
#  * - max gap
#  * - standard deviation of gaps
#  *
#  * Return rows sorted by ascending min gap.
#  *
#  * Also print:
#  * - overall smallest gap in the schedule
#  * - overall largest gap
#  * - histogram of min gaps
#  */
#input file is a csv with two columns, category and subcategory, and no header
def analyzeSubcategorySchedule(filename='../evenly_distributed_subcategories.csv',fixed_emoji_end_num=47):
    from collections import defaultdict
    import math
    import csv

    subcategory_to_positions = defaultdict(list)
    schedule = []
    with open(filename, newline="") as f:
        reader = csv.reader(f)
        for category, subcategory in reader:
            category = category.strip()
            subcategory = subcategory.strip()
            schedule.append((category, subcategory))

    for index, (category, subcategory) in enumerate(schedule):
        subcategory_to_positions[subcategory].append(index)

    analysis = []
    overall_min_gap = math.inf
    overall_max_gap = -math.inf
    min_gap_histogram = defaultdict(int)

    #only analyze subcategories that appear after the first fixed_emoji_end_num emojis, since the first fixed_emoji_end_num emojis are fixed and not shuffled, so their gaps are not relevant to the analysis of the shuffle quality.
    for subcategory, positions in subcategory_to_positions.items():
        positions = [p for p in positions if p >= fixed_emoji_end_num]
        if len(positions) > 1:
            gaps = [positions[i] - positions[i - 1] for i in range(1, len(positions))]
            min_gap = min(gaps)
            max_gap = max(gaps)
            avg_gap = sum(gaps) / len(gaps)
            std_dev_gap = math.sqrt(sum((gap - avg_gap) ** 2 for gap in gaps) / len(gaps))
            analysis.append((subcategory, len(positions), avg_gap, min_gap, max_gap, std_dev_gap))
            overall_min_gap = min(overall_min_gap, min_gap)
            overall_max_gap = max(overall_max_gap, max_gap)
            min_gap_histogram[min_gap] += 1

    analysis.sort(key=lambda x: x[3])  # Sort by ascending min gap

    print("Subcategory Schedule Analysis:")
    print("Subcategory | Count | Avg Gap | Min Gap | Max Gap | Std Dev Gap")
    for row in analysis:
        print(f"{row[0]} | {row[1]} | {row[2]:.2f} | {row[3]} | {row[4]} | {row[5]:.2f}")

    print(f"\nOverall smallest gap in the schedule: {overall_min_gap}")
    print(f"Overall largest gap in the schedule: {overall_max_gap}")
    print("\nHistogram of min gaps:")
    for gap, count in sorted(min_gap_histogram.items()):
        print(f"Min Gap: {gap}, Count: {count}")

 
#input file is a csv with two columns, category and subcategory, and no header
def analyzeCategorySchedule(filename='../evenly_distributed_subcategories.csv', fixed_emoji_end_num=47):
    from collections import defaultdict
    import math
    import csv

    # Load schedule
    schedule= []
    with open(filename, newline="") as f:
        reader = csv.reader(f)
        for category, subcategory in reader:
            category = category.strip()
            subcategory = subcategory.strip()
            schedule.append((category, subcategory))

    # Build category timeline
    category_to_positions = defaultdict(list)
    for index, (category, subcategory) in enumerate(schedule):
        category_to_positions[category].append(index)   

    analysis = []
    overall_min_gap = math.inf
    overall_max_gap = -math.inf
    min_gap_histogram = defaultdict(int)

    #only analyze categories that appear after the first fixed_emoji_end_num emojis, since the first fixed_emoji_end_num emojis are fixed and not shuffled, so their gaps are not relevant to the analysis of the shuffle quality.
    for category, positions in list(category_to_positions.items()):
        positions = [p for p in positions if p >= fixed_emoji_end_num]
        if len(positions) > 1:

            gaps = [positions[i] - positions[i - 1] for i in range(1, len(positions))]

            min_gap = min(gaps)
            max_gap = max(gaps)
            avg_gap = sum(gaps) / len(gaps)

            std_dev_gap = math.sqrt(
                sum((g - avg_gap) ** 2 for g in gaps) / len(gaps)
            )

            analysis.append(
                (category, len(positions), avg_gap, min_gap, max_gap, std_dev_gap)
            )

            overall_min_gap = min(overall_min_gap, min_gap)
            overall_max_gap = max(overall_max_gap, max_gap)

            min_gap_histogram[min_gap] += 1

    analysis.sort(key=lambda x: x[3])  # sort by min gap

    print("Category Schedule Analysis:")
    print("Category | Count | Avg Gap | Min Gap | Max Gap | Std Dev Gap")

    for row in analysis:
        print(f"{row[0]} | {row[1]} | {row[2]:.2f} | {row[3]} | {row[4]} | {row[5]:.2f}")

    print(f"\nOverall smallest gap in the schedule: {overall_min_gap}")
    print(f"Overall largest gap in the schedule: {overall_max_gap}")

    print("\nHistogram of min gaps:")

    for gap, count in sorted(min_gap_histogram.items()):
        print(f"Min Gap: {gap}, Count: {count}")

    # --- extra useful diagnostics ---

    print("\nTop repeated category adjacency (distance 1):")

    adjacency_counts = defaultdict(int)

    for i in range(len(schedule) - 1):
        cat1 = schedule[i][0]
        cat2 = schedule[i + 1][0]
        if cat1 == cat2:
            adjacency_counts[cat1] += 1

    for cat, count in sorted(adjacency_counts.items(), key=lambda x: -x[1]):
        print(f"{cat}: {count}")

    print("\nDiversity score (rolling 7-day windows):")

    def window_diversity(k=7):
        diversities = []
        for i in range(len(schedule) - k + 1):
            window = schedule[i:i + k]
            cats = set(cat for cat, subcat in window)
            diversities.append(len(cats))
        return sum(diversities) / len(diversities)

    print(f"Avg unique categories per 7-day window: {window_diversity(7):.2f}")
    print(f"Avg unique categories per 14-day window: {window_diversity(14):.2f}")


def addCategoryNameToEvenlyDistributedSubcategorySequence(subcategory_sequence_filename='../evenly_distributed_subcategories.csv'):
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    subcategory_to_category = {item['subcategory']: item['category'] for item in calendar_json}

    #it is a csv file with one column, subcategory name, and no header
    subcategory_sequence = []
    with open(subcategory_sequence_filename, 'r') as f:
        for line in f:
            subcategory_sequence.append(line.strip())

    with open(subcategory_sequence_filename, 'w') as f:
        for subcategory in subcategory_sequence:
            category = subcategory_to_category.get(subcategory, 'Unknown')
            f.write(f"{category}, {subcategory}\n")


# now that we have a random distribution of (category, subcategory) pairs in the evenly_distributed_subcategories.csv file, we can add a random emoji from emoji_calendar.json that belongs to that (category, subcategory) pair to each line of the csv file, and save it to a new file called evenly_distributed_subcategories_with_emojis.csv
# the first 47 emojis from emoji_calendar.json should be added to the start of the output file in their current order, and not included in the random shuffle, since they were already used in the game. the rest of the emojis can be shuffled and added to the csv file in the order of the shuffled (category, subcategory) pairs in evenly_distributed_subcategories.csv.
def addRandomEmojisToEvenlyDistributedSubcategorySequence(subcategory_sequence_filename='../evenly_distributed_subcategories.csv', fixed_emoji_end_num=47):
    #step 1: add the first fixed_emoji_end_num emojis (and their name) from emoji_calendar.json to the output file in their current order
    import json
    import random
    import csv      
    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)
    with open('../evenly_distributed_subcategories_with_emojis.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        for item in calendar_json[:fixed_emoji_end_num]:
            category = item.get('category', 'Unknown')
            subcategory = item.get('subcategory', 'Unknown')
            emoji = item.get('emoji', '')
            name= item.get('name', '')
            writer.writerow([category, subcategory, emoji, name])

    #step 2: create mapping of subcategory to list of emojis that belong to that subcategory, using the data from emoji_calendar.json and excluding the first fixed_emoji_end_num emojis
    subcategory_to_emojis = {}
    for item in calendar_json[fixed_emoji_end_num:]:
        subcategory = item.get('subcategory', 'Unknown')
        emoji = item.get('emoji', '')
        name = item.get('name', '')
        if subcategory not in subcategory_to_emojis:
            subcategory_to_emojis[subcategory] = []
        subcategory_to_emojis[subcategory].append((emoji, name))
    
    #step 3: read the shuffled (category, subcategory) pairs from evenly_distributed_subcategories.csv after the first fixed_emoji_end_num lines, and for each line, randomly select an emoji from the corresponding subcategory in the mapping created in step 2, and write the (category, subcategory, emoji, name) to the output file. Remove the selected emoji from the mapping to avoid duplicates.
    with open(subcategory_sequence_filename, 'r') as f:
        reader = csv.reader(f)
        for index, (category, subcategory) in enumerate(reader):
            if index < fixed_emoji_end_num:
                continue
            category = category.strip()
            subcategory = subcategory.strip()
            if subcategory in subcategory_to_emojis and subcategory_to_emojis[subcategory]:
                emoji, name = random.choice(subcategory_to_emojis[subcategory])
                subcategory_to_emojis[subcategory].remove((emoji, name))
                with open('../evenly_distributed_subcategories_with_emojis.csv', 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([category, subcategory, emoji, name])
            else:
                with open('../evenly_distributed_subcategories_with_emojis.csv', 'a', newline='') as f:
                    writer = csv.writer(f)
                    writer.writerow([category, subcategory, '', ''])

    print("# unique emojis in output:", len(set(emoji for _, _, emoji, _ in csv.reader(open('../evenly_distributed_subcategories_with_emojis.csv')))))

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

def useWikiCorpusVersionOfEmojiInEvenlyDistributedCSV():
    import csv
    wiki_corpus_filename= "../corpus/source/wikipedia_corpus.csv"
    my_corpus_filename = "../evenly_distributed_subcategories_with_emojis.csv"
    wiki_corpus = parseCSV_withMetadata(wiki_corpus_filename,0)
    my_corpus = parseCSV_withMetadata(my_corpus_filename,2)
    wiki_base_emoji_to_emoji = {row[0].replace('\ufe0f', ''): row[0] for row in wiki_corpus}
    with open('../evenly_distributed_subcategories_with_emojis.csv', 'w', newline='') as f:
        writer = csv.writer(f)
        for row in my_corpus:
            emoji = row[2].replace('\ufe0f', '')
            if emoji in wiki_base_emoji_to_emoji:
                wiki_emoji = wiki_base_emoji_to_emoji[emoji.replace('\ufe0f', '')]
                writer.writerow([row[0], row[1], wiki_emoji, row[3]])
            else:
                writer.writerow(row)

def variantSelectorDiff():
    #for matching emojis, see if there are any differences in the presence of variant selectors across the 2 corpora. we can do this by creating a mapping of base emoji to the original emoji with variant selector for each corpus, and then comparing the original emojis for matching base emojis across the 2 corpora. if there is a difference in the presence of variant selectors, then we print out the base emoji and the original emojis from both corpora.
    wiki_corpus_filename= "../corpus/source/wikipedia_corpus.csv"
    my_corpus_filename = "../evenly_distributed_subcategories_with_emojis.csv"
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
    # generateEvenlyDistributedSubcategorySequence()
    # addCategoryNameToEvenlyDistributedSubcategorySequence(subcategory_sequence_filename='../evenly_distributed_subcategories.csv')
    useWikiCorpusVersionOfEmojiInEvenlyDistributedCSV()
    variantSelectorDiff()