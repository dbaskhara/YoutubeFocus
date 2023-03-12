#include <stdlib.h>
#include <vector>
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

vector<string> dataNames;
vector<string> dataURLs;

void writeData(string name, string url)
{
    ofstream outputFileName, outputFileURL;
    outputFileName.open("channelName.txt", ios::app);
    outputFileURL.open("channelURL.txt", ios::app);
    if (!outputFileName || !outputFileURL)
    {
        cout << "File error" << endl;
    }
    outputFileName << name << endl;
    outputFileName.close();
    outputFileURL << url << endl;
    outputFileURL.close();
}

void readName()
{
    ifstream input_file("channelName.txt");
    string line;
    int line_number = 1;
    if (input_file.is_open())
    {
        while (getline(input_file, line))
        {
            if (!input_file.eof())
            {
                cout << line_number << "." << line << endl;
                dataNames.push_back(line);
                line_number++;
            }
        }
        input_file.close();
    }
    else
    {
        std::cerr << "Failed to open file" << std::endl;
    }
}

void readURL()
{
    ifstream input_file("channelURL.txt");
    string line;
    int line_number = 1;
    if (input_file.is_open())
    {
        while (getline(input_file, line))
        {
            if (!input_file.eof())
            {
                dataURLs.push_back(line);
                line_number++;
            }
        }
        input_file.close();
    }
    else
    {
        std::cerr << "Failed to open file" << std::endl;
    }
}

main()
{
    int input;
    cout << "0.New Input" << endl;
    readName();
    readURL();
    cout << "Input : ";
    cin >> input;
    if (input == 0)
    {
        cin.ignore();
        system("cls");
        int write;
        string channelName, channelURL;
        cout << "Enter Channel Name : ";
        getline(cin, channelName);
        cout << "Enter Channel URL : ";
        cin >> channelURL;
        writeData(channelName, channelURL);
    }
    else
    {
       system(("start " + dataURLs[input - 1]).c_str());
    }
    return 0;
}