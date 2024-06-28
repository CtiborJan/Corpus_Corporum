import sys,cc

sys.stdin.close()
sys.stdin = open('/dev/tty')

rv=input("Press enter to stop the loop...\n")
cc.line_up()
sys.exit(1)
