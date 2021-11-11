#
# Written by YASHWANT JODHA for Honeyuncle Edu Assignment
#

# using pdfplumber for extracting text from the pdf
import re, pdfplumber

# Firebase setup
import firebase_admin
from firebase_admin import credentials
from firebase_admin import firestore

cred = credentials.Certificate('honeyuncleedu-13439-c627d4daa3cc.json')
firebase_admin.initialize_app(cred)

db = firestore.client()


with pdfplumber.open("2018Paper1_ENGLISH.pdf") as pdf:
	pages = pdf.pages

	# splitted the pdf into 3 parts for 'Physics', 'Chemistry' and 'Mathematics'
	parts = [pages[:12], pages[12:24], pages[24:]]

	for part_num, part in enumerate(parts):
		total_question_count = 1 # to keep track of questions for 'document' name

		for page_num, page in enumerate(part):
			question_count = 0 # question count of each page
			data = [] # list containing dicts of questions with options (if have)
			text = page.extract_text()

			# Extracting Questions
			ques_pattern = re.compile(r'Q.\d.*?(\?|(?=Q\.)|__\.|\(A\))', flags=re.DOTALL)
			ques_iterator = ques_pattern.finditer(text)

			for question_number, question_match in enumerate(ques_iterator):
				data.append({
					"Question description": question_match.group(0)
					})
				question_count += 1

			# Extracting Options
			options_pattern = re.compile(r'\(A\).*?[^Q]*', flags=re.DOTALL)
			options_iterator = options_pattern.finditer(text)

			# I am making an assumption that if a page have x questions then either all x have options or none of them have (observation from pdf)
			for idx, option_match in enumerate(options_iterator):
				options = option_match.group(0)

				data[idx]["option1"] = re.search(r'\(A\).*(?=\(B)', options, flags=re.DOTALL).group(0)

				# The figures causes sometimes the D to appear ahead of C
				# quick fix for one page that have the above error
				if (page_num == 8 and part_num == 1):
					data[idx]["option2"] = re.search(r'\(B\).*(?=\(C)', options, flags=re.DOTALL).group(0)
					data[idx]["option3"] = re.search(r'\(C\).*(?=\(D)', options, flags=re.DOTALL).group(0)
					data[idx]["option4"] = re.search(r'\(D\).*', options, flags=re.DOTALL).group(0)
				else:
					data[idx]["option2"] = re.search(r'\(B\).*(?=\D)', options, flags=re.DOTALL).group(0)
					data[idx]["option3"] = re.search(r'\(C\).*', options, flags=re.DOTALL).group(0)
					data[idx]["option4"] = re.search(r'\(D\).*(?=\(C)*', options, flags=re.DOTALL).group(0)

			# UPLOADING the data to firestone database
			for q in range(question_count):
				doc_ref = db.collection('Part ' + str(part_num + 1)).document('Question '+ str(q + total_question_count))
				question = data[q]

				if len(question) == 1:
					# Question does not have options
					doc_ref.set({
						"Question description": question["Question description"]
						})
				else:
					# Question does have options
					doc_ref.set({
						"Question description": question["Question description"],
						"Option 1": question["option1"],
						"Option 2": question["option2"],
						"Option 3": question["option3"],
						"Option 4": question["option4"]
						})

			# incrementing it for each page, to track for all pages of parts
			total_question_count += question_count