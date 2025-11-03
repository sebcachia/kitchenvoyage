+++
title = '{{ replace .File.ContentBaseName "-" " " | title }}'
date = {{ .Date }}
description = ''
featured_image = ''
featured_image_alt = ''
categories = ['Recipe']
tags = []
draft = true

[recipe]
  name = '{{ replace .File.ContentBaseName "-" " " | title }}'
  description = ''
  yield = ''
  prepTime = 'PT15M'
  cookTime = 'PT30M'
  totalTime = 'PT45M'
  image = ''
  cuisine = ''
  category = ''
  keywords = []
  notes = ''
  ingredients = [
    ''
  ]
  instructions = [
    ''
  ]
  [recipe.nutrition]
    calories = ''
+++
