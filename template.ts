type Template = {
	title: string
	description: string
	userId: string
	elements: FormElement[]
}

type Option = { value: string; order: number }

type FormElement =
	| { type: "input"; text: string; order: number; id: string }
	| { type: "textarea"; text: string; order: number; id: string }
	| { type: "multichoice"; text: string; order: number; options: Option[]; id: string }
	| { type: "checkbox"; text: string; order: number; options: Option[]; id: string }

export const template: Template = {
	title: "Form Template title",
	description: "big long description describing what this is",
	userId: "7b5938bd-fe50-4928-b4a7-40be36bc8219",
	elements: [
		{
			id: "1",
			type: "input",
			order: 0,
			text: "What is your name?",
		},
		{
			id: "2",
			type: "multichoice",
			order: 1,
			text: "What is your favorite color?",
			options: [
				{ value: "red", order: 0 },
				{ value: "green", order: 1 },
				{ value: "red", order: 2 },
			],
		},
	],
}
