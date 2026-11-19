import Foundation

/// The website's quote of the day (components/planner/DailyAffirmation.tsx),
/// picked the same way so the phone and desktop show the same quote.
enum Quotes {
    static let all: [(quote: String, byline: String)] = [
        ("You have power over your mind, not outside events. Realize this, and you will find strength.", "- Marcus Aurelius"),
        ("The impediment to action advances action. What stands in the way becomes the way.", "- Marcus Aurelius"),
        ("Waste no more time arguing about what a good man should be. Be one.", "- Marcus Aurelius"),
        ("It is not death that a man should fear, but he should fear never beginning to live.", "- Marcus Aurelius"),
        ("Very little is needed to make a happy life; it is all within yourself, in your way of thinking.", "- Marcus Aurelius"),
        ("The best revenge is to be unlike him who performed the injustice.", "- Marcus Aurelius"),
        ("If it is not right, do not do it; if it is not true, do not say it.", "- Marcus Aurelius"),
        ("Accept the things to which fate binds you, and love the people with whom fate brings you together.", "- Marcus Aurelius"),
        ("The first rule is to keep an untroubled spirit. The second is to look things in the face and know them for what they are.", "- Marcus Aurelius"),
        ("Never esteem anything as of advantage to you that will make you break your word or lose your self-respect.", "- Marcus Aurelius"),
        ("He who fears death will never do anything worth of a man who is alive.", "- Seneca"),
        ("We suffer more in imagination than in reality.", "- Seneca"),
        ("Begin at once to live, and count each separate day as a separate life.", "- Seneca"),
        ("It is not that I'm so smart, it's just that I stay with problems longer.", "- Seneca"),
        ("Luck is what happens when preparation meets opportunity.", "- Seneca"),
        ("Retire into yourself as much as you can. Associate with those who are likely to improve you.", "- Seneca"),
        ("No person has the power to have everything they want, but it is in their power not to want what they don't have.", "- Seneca"),
        ("It is the power of the mind to be unconquerable.", "- Seneca"),
        ("You act like mortals in all that you fear, and like immortals in all that you desire.", "- Seneca"),
        ("Omnia aliena sunt, tempus tantum nostrum est. All things are alien; time alone is ours.", "- Seneca"),
        ("Make the best use of what is in your power, and take the rest as it happens.", "- Epictetus"),
        ("He is a wise man who does not grieve for the things which he has not, but rejoices for those which he has.", "- Epictetus"),
        ("First say to yourself what you would be; then do what you have to do.", "- Epictetus"),
        ("Seek not that the things which happen should happen as you wish; but wish the things which happen to be as they are, and you will have a tranquil flow of life.", "- Epictetus"),
        ("Don't explain your philosophy. Embody it.", "- Epictetus"),
        ("Of all existing things some are in our power, and others are not in our power.", "- Epictetus"),
        ("It's not what happens to you, but how you react to it that matters.", "- Epictetus"),
        ("No man is free who is not master of himself.", "- Epictetus"),
        ("If anyone tells you that a certain person speaks ill of you, do not make excuses about what is said of you, but answer: he did not know my other faults, else he would not have mentioned only these.", "- Epictetus"),
        ("Freedom is the only worthy goal in life. It is won by disregarding things that lie beyond our control.", "- Epictetus"),
        ("Man conquers the world by conquering himself.", "- Zeno of Citium"),
        ("Well-being is attained by little and little, and nevertheless is no little thing itself.", "- Zeno of Citium"),
        ("The goal of life is living in agreement with nature.", "- Zeno of Citium"),
        ("Better to trip with the feet than with the tongue.", "- Zeno of Citium"),
        ("Fate leads the willing and drags along the reluctant.", "- Cleanthes"),
        ("A gem cannot be polished without friction, nor a man perfected without trials.", "- Stoic Proverb"),
        ("True happiness is to enjoy the present, without anxious dependence upon the future.", "- Seneca"),
        ("If you want to improve, be content to be thought foolish and stupid.", "- Epictetus"),
        ("The things that truly matter are within us; the rest is noise.", "- Marcus Aurelius"),
        ("Confine yourself to the present.", "- Marcus Aurelius"),
        ("You could leave life right now. Let that determine what you do, say, and think.", "- Marcus Aurelius"),
        ("The soul becomes dyed with the colour of its thoughts.", "- Marcus Aurelius"),
        ("How much more grievous are the consequences of anger than the causes of it.", "- Marcus Aurelius"),
        ("Perfection of character is this: to live each day as if it were your last, without frenzy, without apathy, without pretense.", "- Marcus Aurelius"),
        ("Associate with people who are likely to improve you.", "- Seneca"),
        ("There is no easy way from the earth to the stars.", "- Seneca"),
        ("Difficulties strengthen the mind, as labor does the body.", "- Seneca"),
        ("I judge you unfortunate because you have never lived through misfortune. You have passed through life without an opponent.", "- Seneca"),
        ("Do not indulge in dreams of what you do not have, but count up the chief of the blessings you do have.", "- Marcus Aurelius"),
        ("To bear trials with a calm mind robs misfortune of its strength and burden.", "- Seneca"),
    ]

    static var today: (quote: String, byline: String) {
        let days = Int(Date().timeIntervalSince1970 / 86_400)
        return all[days % all.count]
    }
}
