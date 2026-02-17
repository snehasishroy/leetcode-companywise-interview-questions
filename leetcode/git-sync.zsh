#!/bin/zsh

folder_name="leetcode-companywise-interview-questions"
repo_url="https://github.com/snehasishroy/leetcode-companywise-interview-questions.git"

if [ -d "$folder_name" ]; then
  echo "Directory $folder_name exists."
  echo "Pulling latest changes..."
  cd "$folder_name" || exit
  git pull
  cd ..
else
  echo "Directory $folder_name does not exist."
  echo "Cloning repository..."
  git clone "$repo_url"
fi

echo "Done."
