export type Grade = 9 | 10
export type ScienceChapter = { id: string; grade: Grade; number: number; title: string }

const classNineTitles = [
  'Exploration: Entering the World of Secondary Science',
  'Cell: The Building Block of Life',
  'Tissues in Action',
  'Describing Motion Around Us',
  'Exploring Mixtures and their Separation',
  'How Forces Affect Motion',
  'Work, Energy and Simple Machines',
  'Journey Inside the Atom',
  'Atomic Foundations of Matter',
  'Sound Waves: Characteristics and Applications',
  'Reproduction: How Life Continues',
  'Patterns in Life: Diversity and Classification',
]

const classTenTitles = [
  'Chemical Reactions and Equations',
  'Acids, Bases and Salts',
  'Metals and Non-metals',
  'Carbon and its Compounds',
  'Periodic Classification of Elements',
  'Life Processes',
  'Control and Coordination',
  'How do Organisms Reproduce?',
  'Heredity and Evolution',
  'Light – Reflection and Refraction',
  'The Human Eye and the Colourful World',
  'Electricity',
  'Magnetic Effects of Electric Current',
  'Sources of Energy',
  'Our Environment',
  'Sustainable Management of Natural Resources',
]

export function getChapters(grade: Grade): ScienceChapter[] {
  const titles = grade === 9 ? classNineTitles : classTenTitles
  return titles.map((title, index) => ({ id: `${grade}-${index + 1}`, grade, number: index + 1, title }))
}
