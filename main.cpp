#include <stdlib.h>
#include <vector>
#include <iostream>
#include <fstream>
#include <string>
using namespace std;

vector<vector<string>> dataLists;
string channelName, channelURL, line;
int input, count, lineNumber;

void readData()
{
    ifstream inputFile;
    count = 1;
    dataLists.clear();
    inputFile.open("channelData.txt");
    if (!inputFile)
    {
        cout << "File error" << endl;
        return;
    }
    while (getline(inputFile, line))
    {
        size_t delimiter = line.find(",");
        if (delimiter != string::npos)
        {
            string name = line.substr(0, delimiter);
            string url = line.substr(delimiter + 1);
            dataLists.push_back(vector<string>{name});
            dataLists[count - 1].push_back(url);
            cout << count << "." << name << ", " << url << endl;
            count++;
        }
    }
    inputFile.close();
}

void inputDecision()
{
    cout << "0.Manage List" << endl;
    readData();
    cout << "Input : ";
    cin >> input;
}

void inputData()
{
    cin.ignore();
    system("cls");
    cout << "Enter Channel Name : ";
    getline(cin, channelName);
    cout << "Enter Channel URL : ";
    cin >> channelURL;
}

void writeData(string name, string url)
{
    ofstream outputFile;
    outputFile.open("channelData.txt", ios::app);
    if (!outputFile)
    {
        cout << "File error" << endl;
        return;
    }
    outputFile << name << "," << url << endl;
    outputFile.close();
}

void CRUDDecision()
{
    system("cls");
    cout << "1.Create Data" << endl
         << "2.Update Data" << endl
         << "3.Delete Data" << endl
         << "Input : ";
    cin >> input;
}

void rewriteData(string option)
{
    system("cls");
    count = 1;
    cout << "Please Choose Data To " << option << endl;
    for (int i = 0; i < dataLists.size(); i++)
    {
        cout << count << "." << dataLists[i][0] << "," << dataLists[i][1] << endl;
        count++;
    }
    cout << "Input : ";
    cin >> input;
}

void replaceData(string type)
{
    ifstream inputFile("channelData.txt");
    ofstream outputFile("channelData.txt", ios::app);
    ofstream tempFile("temp.txt");
    lineNumber = 0;
    while (getline(inputFile, line))
    {
        if (type == "Edit")
        {
            if (lineNumber == input - 1)
            {
                tempFile << channelName << "," << channelURL << endl;
            }
            else
            {
                tempFile << line << endl;
            }
        }
        else if (type == "Delete")
        {
            if (lineNumber == input - 1)
            {
            }
            else
            {
                tempFile << line << endl;
            }
        }
        lineNumber++;
    }
    inputFile.close();
    outputFile.close();
    tempFile.close();
    remove("channelData.txt");
    rename("temp.txt", "channelData.txt");
}

main()
{
opening:
    system("cls");
    inputDecision();
    if (input == 0)
    {
        CRUDDecision();
        if (input == 1)
        {
            inputData();
            writeData(channelName, channelURL);
        }
        else if (input == 2)
        {
            rewriteData("Edit");
            inputData();
            replaceData("Edit");
        }
        else if (input == 3)
        {
            rewriteData("Delete");
            replaceData("Delete");
        }
    }
    else
    {
        system(("start " + dataLists[input - 1][1]).c_str());
    }
    cout << "Please enter Y to restart program ";
    cin >> line;
    if (line == "y" || line == "y")
    {
        goto opening;
    }
    return 0;
}