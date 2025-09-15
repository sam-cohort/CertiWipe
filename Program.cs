using System;
using System.IO;
using System.Linq;
using System.Collections.Generic;

public record Drive(string DevicePath, string MountPath, long Size);

public class Program
{
    public static void Main(string[] args)
    {
        Console.WriteLine("--- CertiWipe Linux Secure Wipe ---");

        // --- Step 1: Find Removable Drives ---
        var removableDrives = FindRemovableDrivesOnLinux();
        if (removableDrives.Count == 0)
        {
            Console.WriteLine("No removable drives found.");
            return;
        }

        // --- Step 2: Ask User to Select a Drive ---
        Console.WriteLine("\nPlease select a drive to WIPE:");
        for (int i = 0; i < removableDrives.Count; i++)
        {
            Console.WriteLine($"  [{i}] {removableDrives[i].DevicePath} ({removableDrives[i].MountPath}) - {removableDrives[i].Size / 1_000_000_000} GB");
        }

        Console.Write("\nEnter the number of the drive to WIPE: ");
        if (!int.TryParse(Console.ReadLine(), out int choice) || choice < 0 || choice >= removableDrives.Count)
        {
            Console.WriteLine("Invalid selection. Aborting.");
            return;
        }
        Drive selectedDrive = removableDrives[choice];

        // --- Step 3: Get Final Confirmation ---
        Console.WriteLine($"\nWARNING! You are about to permanently erase ALL DATA on {selectedDrive.DevicePath}.");
        Console.WriteLine("This action CANNOT be undone.");
        Console.Write("Type 'ERASE' in all caps to confirm: ");
        if (Console.ReadLine() != "ERASE")
        {
            Console.WriteLine("Confirmation not received. Aborting.");
            return;
        }

        // --- Step 4: Perform the Wipe ---
        Console.WriteLine($"\nStarting secure wipe on {selectedDrive.DevicePath}... Please wait.");
        try
        {
            long totalBytes = selectedDrive.Size;
            long bytesWritten = 0;
            byte[] buffer = new byte[1024 * 1024]; // 1MB buffer

            using (FileStream driveStream = new FileStream(selectedDrive.DevicePath, FileMode.Open, FileAccess.Write))
            {
                while (bytesWritten < totalBytes)
                {
                    long remainingBytes = totalBytes - bytesWritten;
                    int bytesToWrite = (int)Math.Min(buffer.Length, remainingBytes);
                    driveStream.Write(buffer, 0, bytesToWrite);
                    bytesWritten += bytesToWrite;
                    double percentage = ((double)bytesWritten / totalBytes) * 100;
                    Console.Write($"\rWiping... {percentage:F2}% complete.");
                }
            }
            Console.WriteLine("\n\nSecure wipe completed successfully!");
        }
        catch (Exception ex)
        {
            Console.WriteLine($"\nAn error occurred: {ex.Message}");
            if (ex is UnauthorizedAccessException)
            {
                Console.WriteLine("Hint: Please make sure to run the application with 'sudo'.");
            }
        }
    }

    public static List<Drive> FindRemovableDrivesOnLinux()
    {
        var drives = new List<Drive>();
        string[] mounts = File.ReadAllLines("/proc/mounts");
        foreach (string mount in mounts)
        {
            string[] parts = mount.Split(' ');
            string device = parts[0];
            string mountPoint = parts[1];

            // This is the corrected, more reliable detection method for Linux
            if (device.StartsWith("/dev/sd") && (mountPoint.StartsWith("/media") || mountPoint.StartsWith("/mnt")))
            {
                try
                {
                    var driveInfo = new DriveInfo(mountPoint);
                    if (driveInfo.IsReady)
                    {
                        drives.Add(new Drive(device, mountPoint, driveInfo.TotalSize));
                    }
                }
                catch 
                { 
                    // Ignore drives that aren't fully ready or accessible
                }
            }
        }
        return drives;
    }
}
