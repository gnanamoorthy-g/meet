export const random_name_generator = () => {
    let firstNames = [
        "Autumn",
        "Hidden",
        "Bitter",
        "Misty",
        "Silent",
        "Empty",
        "Dry",
        "Dark",
        "Summer",
        "Icy",
        "Delicate",
        "Quiet",
        "White",
        "Cool",
        "Spring",
        "Winter",
        "Patient",
        "Twilight",
        "Dawn",
        "Crimson",
        "Wispy",
        "Weathered",
        "Blue",
        "Billowing",
        "Broken",
        "Cold",
        "Damp",
        "Falling",
        "Frosty",
        "Green",
        "Long",
        "Late",
        "Lingering",
        "Bold",
        "Little",
        "Morning",
        "Muddy",
        "Old",
        "Red",
        "Rough",
        "Still",
        "Small",
        "Sparkling",
        "Wandering",
        "Withered",
        "Wild",
        "Black",
        "Young",
        "Holy",
        "Solitary",
        "Fragrant",
        "Aged",
        "Snowy",
        "Proud",
        "Floral",
        "Restless",
        "Divine",
        "Polished",
        "Ancient",
        "Purple",
        "Lively",
        "Nameless",
    ];

    let lastNames = [
        "Waterfall",
        "River",
        "Breeze",
        "Moon",
        "Rain",
        "Wind",
        "Sea",
        "Morning",
        "Snow",
        "Lake",
        "Sunset",
        "Pine",
        "Shadow",
        "Leaf",
        "Dawn",
        "Glitter",
        "Forest",
        "Hill",
        "Cloud",
        "Meadow",
        "Sun",
        "Glade",
        "Bird",
        "Brook",
        "Butterfly",
        "Bush",
        "Dew",
        "Dust",
        "Field",
        "Fire",
        "Flower",
        "Firefly",
        "Feather",
        "Grass",
        "Haze",
        "Mountain",
        "Night",
        "Pond",
        "Darkness",
        "Snowflake",
        "Silence",
        "Sound",
        "Sky",
        "Shape",
        "Surf",
        "Thunder",
        "Violet",
        "Water",
        "Wildflower",
        "Wave",
        "Water",
        "Resonance",
        "Sun",
        "Wood",
        "Dream",
        "Cherry",
        "Tree",
        "Fog",
        "Frost",
        "Voice",
        "Paper",
        "Frog",
        "Smoke",
        "Star",
    ];

    var firstName = firstNames[Math.floor(Math.random() * firstNames.length)];
    var lastName = lastNames[Math.floor(Math.random() * lastNames.length)];

    return [firstName, lastName];
};
