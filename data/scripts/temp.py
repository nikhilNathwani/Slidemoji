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
def generateEvenlyDistributedSubcategorySequence():
    import json
    import random
    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    # the first 47 emojis in the calendar are fixed. the remaining 1290 emojis' subcategories should be shuffled according to the above requirements.
    # so we will only shuffle the subcategories of the emojis from index 47 onwards, and keep the first 47 emojis' subcategories fixed at the start of the output sequence.
    # we will also need to account for the fact that the first 47 emojis belong to certain subcategories, so we will need to subtract those counts from the total counts when calculating the ideal gaps for those subcategories.
    # first, we will count the occurrences of each subcategory in the first 47 emojis, and then subtract those counts from the total counts when calculating the ideal gaps for those subcategories.
    # we will also need to ensure that the first 47 emojis' subcategories are included in the output sequence at the start, and then we will append the shuffled subcategories of the remaining emojis after that.
    fixed_subcategories = [item.get('subcategory', 'Unknown') for item in calendar_json[:47]]
    subcategory_to_emojis = {}
    for item in calendar_json:
        subcategory = item.get('subcategory', 'Unknown')
        if subcategory not in subcategory_to_emojis:
            subcategory_to_emojis[subcategory] = []
        subcategory_to_emojis[subcategory].append(item)
    total_emoji_count = len(calendar_json)
    subcategory_positions = []
    for subcategory, emojis in subcategory_to_emojis.items():
        subcategory_count = len(emojis)
        ideal_gap = total_emoji_count / subcategory_count
        random_offset = random.uniform(0, ideal_gap)
        for occurrence_index in range(subcategory_count):
            target_position = random_offset + occurrence_index * ideal_gap
            subcategory_positions.append((subcategory, target_position))
    subcategory_positions.sort(key=lambda x: x[1])
    evenly_distributed_subcategories = [subcategory for subcategory, _ in subcategory_positions]
    print("Evenly distributed subcategory sequence:")
    for subcategory in evenly_distributed_subcategories:
        print(subcategory)

    #output to file
    with open('../evenly_distributed_subcategories.txt', 'w') as f:
        for subcategory in evenly_distributed_subcategories:
            f.write(subcategory + '\n')

    return evenly_distributed_subcategories

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
def analyzeSubcategorySchedule(filename='../evenly_distributed_subcategories.txt'):
    from collections import defaultdict
    import math

    subcategory_to_positions = defaultdict(list)
    with open(filename, 'r') as f:
        schedule = [line.strip() for line in f]
    for index, subcategory in enumerate(schedule):
        subcategory_to_positions[subcategory].append(index)

    analysis = []
    overall_min_gap = math.inf
    overall_max_gap = -math.inf
    min_gap_histogram = defaultdict(int)

    for subcategory, positions in subcategory_to_positions.items():
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

 
def analyzeCategorySchedule(filename='../evenly_distributed_subcategories.txt'):
    from collections import defaultdict
    import math

    # Load schedule
    with open(filename, 'r') as f:
        schedule = [line.strip() for line in f]

    # You still need subcategory → category mapping
    import json
    with open('../emoji_calendar.json', 'r') as f:
        calendar = json.load(f)

    subcategory_to_category = {}
    for item in calendar:
        subcategory_to_category[item['subcategory']] = item['category']

    category_to_positions = defaultdict(list)

    # Build category timeline
    for index, subcategory in enumerate(schedule):
        category = subcategory_to_category.get(subcategory, 'Unknown')
        category_to_positions[category].append(index)

    analysis = []
    overall_min_gap = math.inf
    overall_max_gap = -math.inf
    min_gap_histogram = defaultdict(int)

    for category, positions in category_to_positions.items():
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
        c1 = subcategory_to_category.get(schedule[i])
        c2 = subcategory_to_category.get(schedule[i + 1])
        if c1 == c2:
            adjacency_counts[c1] += 1

    for cat, count in sorted(adjacency_counts.items(), key=lambda x: -x[1]):
        print(f"{cat}: {count}")

    print("\nDiversity score (rolling 7-day windows):")

    def window_diversity(k=7):
        diversities = []
        for i in range(len(schedule) - k + 1):
            window = schedule[i:i + k]
            cats = set(subcategory_to_category.get(s) for s in window)
            diversities.append(len(cats))
        return sum(diversities) / len(diversities)

    print(f"Avg unique categories per 7-day window: {window_diversity(7):.2f}")
    print(f"Avg unique categories per 14-day window: {window_diversity(14):.2f}")


def addCategoryNameToEvenlyDistributedSubcategorySequence(subcategory_sequence_filename='../evenly_distributed_subcategories.csv', output_filename='../evenly_distributed_categories_and_subcategories.txt'):
    import json

    with open('../emoji_calendar.json', 'r') as f:
        calendar_json = json.load(f)

    subcategory_to_category = {item['subcategory']: item['category'] for item in calendar_json}

    #it is a csv file with one column, subcategory name, and no header
    subcategory_sequence = []
    with open(subcategory_sequence_filename, 'r') as f:
        for line in f:
            subcategory_sequence.append(line.strip())

    with open(output_filename, 'w') as f:
        for subcategory in subcategory_sequence:
            category = subcategory_to_category.get(subcategory, 'Unknown')
            f.write(f"{category}, {subcategory}\n")


if __name__ == "__main__":
    # generateEvenlyDistributedSubcategorySequence()
    analyzeSubcategorySchedule()
    analyzeCategorySchedule()